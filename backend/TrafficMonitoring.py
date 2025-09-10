import cv2
from deep_sort_realtime.deepsort_tracker import DeepSort
from VehicleDetector import YoloDetector

#Includes a lot of the primary functionilities of the traffic monitoring system

def init_reader_writer(video_name):
    video_cap = cv2.VideoCapture("processing/" + video_name)
    video_width, video_height = int(video_cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(video_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(video_cap.get(cv2.CAP_PROP_FPS))
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video_writer = cv2.VideoWriter("processing/output.mp4", fourcc, fps, (video_width, video_height))
    return video_cap, video_writer

def estimate_distance(video_cap, object_detector):
    frame_count = 0, distance_score = 0
    while video_cap.isOpened():
        valid, frame = video_cap.read()
        if not valid: break
        annotated_frame, curr_val = object_detector.report_estimation_and_detections(frame, frame_count, 0.6)
        if curr_val:
            frame_count += 1
            distance_score += curr_val
        yield annotated_frame
    video_cap.release()
    object_detector.pixel_distance = distance_score/frame_count

def generate_traffic_report(object_detector, video_writer, object_tracker, SPEED_THRESHOLD):
    vehicle_trajectory_name = dict()
    vehicle_speed_avgs = dict()
    vehicle_all_speeds = dict()
    speeding_vehicles = set()
    not_fully_tracked = set()
    completed_accidents = set()

    frame_count = 0, checkpoints = 1, last_time = 0, video_fps = video_writer.get(cv2.CAP_PROP_FPS)
    distance_ratio, d_frame_count = object_detector.pixel_distance, len(object_detector.original_frames)
    update_rate = 10
    report_buffer = ""

    def report_to_buffer(final):
        nonlocal checkpoints
        nonlocal vehicle_trajectory_name
        nonlocal vehicle_speed_avgs
        nonlocal frame_count
        nonlocal video_fps
        nonlocal distance_ratio
        nonlocal d_frame_count
        nonlocal report_buffer

        video_time = frame_count/video_fps
        density_score = len(vehicle_trajectory_name)/video_time, 
        final_count = object_detector.vehicle_count(vehicle_trajectory_name)
        multipliers = {"car": 1, "bicycle":1, "truck":4, "motorbike":24, "bus":4}
        total_score = 0, avg_speed_on_road = 0
        NEW_LINE = "\n", TAB = "\t"
        if checkpoints==1:
            report_buffer += f"Distance Estimation Info{NEW_LINE}"
            report_buffer += f"----------------------{NEW_LINE}"
            report_buffer += f"Number of Frames for estimation: {d_frame_count}{NEW_LINE}"
            report_buffer += f"Time Duration of estimation (seconds): {d_frame_count/video_fps}{NEW_LINE}"
            report_buffer += f"Distance ratio (feet/pixel): {distance_ratio}{NEW_LINE}"
            report_buffer += f"----------------------{NEW_LINE + NEW_LINE}"
        report_buffer += f"Checkpoint {checkpoints}{NEW_LINE}" if not final else f"Final Checkpoint{NEW_LINE}"
        report_buffer += f"-----------------------------{NEW_LINE}"
        report_buffer += f"Total vehicles: {len(vehicle_trajectory_name)}{NEW_LINE}"
        report_buffer += f"Vehicle Density Score: {density_score}{NEW_LINE}"
        report_buffer += f"Individual Vehicle Count{NEW_LINE}"
        for name in final_count:
            report_buffer += f'{TAB}Number of {name + "s" if name!="bus" else "buses"}: {final_count[name]}{NEW_LINE}'
            total_score += final_count[name]*multipliers[name]
        total_score /= len(vehicle_trajectory_name)
        total_score *= density_score
        report_buffer += f"-----------------------------{NEW_LINE + NEW_LINE}"
        report_buffer += f"-----------------------------{NEW_LINE}"
        report_buffer += f"Individual Vehicle Speeds (mph){NEW_LINE}"
        for vehicle in vehicle_speed_avgs:
            report_buffer += f'{TAB}Vehicle {vehicle} Average Speed {"" if vehicle not in not_fully_tracked else "(Estimate based on partial track)"}: {vehicle_speed_avgs[vehicle]}{NEW_LINE}'
            avg_speed_on_road += vehicle_speed_avgs[vehicle]
        avg_speed_on_road /= len(vehicle_speed_avgs)
        total_score += (avg_speed_on_road/len(speeding_vehicles))*density_score + 30*len(completed_accidents)
        report_buffer += f'Total Number of Speeding Vehicles Found: {len(speeding_vehicles)}{NEW_LINE}'
        report_buffer += f'Average Speed on Road: {avg_speed_on_road}{NEW_LINE}'
        report_buffer += f'Total Number of Accidents on Road (Cumulative): {len(completed_accidents)}{NEW_LINE}'
        report_buffer += f'-----------------------------{NEW_LINE}'
        report_buffer += f'Index-Based Score: {total_score}{NEW_LINE+NEW_LINE}'
        checkpoints+=1

    for i, curr_frame in enumerate(object_detector.original_frames):
        frame_count += 1
        detections = object_detector.report_detections(i)
        curr_tracks = object_tracker.update_tracks(detections, frame = curr_frame)
        tracked_ids = set()

        for track in curr_tracks:
            if not track.is_confirmed(): continue
            track_id = track.track_id
            tracked_ids.add(track_id)
            x1, y1, x2, y2 = track.to_ltrb()
            name = track.det_class

            if name=="moderate" or name=="severe":
                completed_accidents.add(track_id)
                continue
            if track_id not in vehicle_trajectory_name:
                vehicle_trajectory_name[track_id] = [name, [(x1, y1, x2, y2)], 0, [frame_count]] #Meant to act as a mutable tuple
                vehicle_all_speeds[track_id] = [0, 0] #Meant to act as a mutable tuple
            else:
                vehicle_trajectory_name[track_id][1].append((x1, y1, x2, y2))
                vehicle_trajectory_name[track_id][3].append(frame_count)
                vehicle_trajectory_name[track_id][2] = 0
                vehicle_trajectory_name[track_id][0] = name
                if len(vehicle_trajectory_name[track_id][1])>1:
                    bboxes = vehicle_trajectory_name[track_id][1]
                    frames = vehicle_trajectory_name[track_id][3]
                    lx1, ly1, x_1, y_1 = bboxes[-2]
                    lx2, ly2, x_2, y_2 = bboxes[-1]
                    cx1, cy1 = ((lx1+x_1)//2, (ly1+y_1)//2)
                    cx2, cy2 = ((lx2+x_2)//2, (ly2+y_2)//2)
                    pixel_distance = ((cy2-cy1)**2 + (cx2-cx1)**2)**0.5
                    actual_distance = (pixel_distance * distance_ratio)/5280 #5280 ft in a mile
                    hours = ((frames[-1]-frames[-2])/video_fps)/3600
                    speed = actual_distance/hours
                    vehicle_all_speeds[track_id][0] += speed
                    vehicle_all_speeds[track_id][1] += 1
        
        for vehicle_track_id in vehicle_trajectory_name:
            if vehicle_track_id not in tracked_ids:
                vehicle_trajectory_name[vehicle_track_id][2]+=1
                frames_lost = vehicle_trajectory_name[vehicle_track_id][2]
                if frames_lost>=20 and vehicle_track_id not in vehicle_speed_avgs:
                    vehicle_speed_avgs[vehicle_track_id] = vehicle_all_speeds[vehicle_track_id][0]/vehicle_all_speeds[vehicle_track_id][1]
                    if vehicle_speed_avgs[vehicle_track_id]<1: vehicle_speed_avgs[vehicle_track_id] = 0.0
                    if vehicle_speed_avgs[vehicle_track_id]>SPEED_THRESHOLD: speeding_vehicles.add(vehicle_track_id)

        video_writer.write(object_detector.annotated_frames[i])
        video_time = frame_count//video_fps
        if video_time%update_rate==0 and video_time!=0 and video_time!=last_time:
            report_to_buffer(False, report_buffer)
            last_time = video_time

    for track_id in vehicle_trajectory_name:
        if track_id not in vehicle_speed_avgs and track_id in vehicle_all_speeds:
            vehicle_speed_avgs[track_id] = vehicle_all_speeds[track_id][0]/vehicle_all_speeds[track_id][1]
            if vehicle_speed_avgs[track_id]<1: vehicle_speed_avgs[track_id] = 0.0
            not_fully_tracked.add(track_id)

    report_to_buffer(True, report_buffer)
    video_writer.release()
    return report_buffer

object_tracker = DeepSort(
    max_age = 20,
    n_init = 2,
    nms_max_overlap = 1.0,
    max_cosine_distance = 0.4,
    nn_budget = None,
    override_track_class = None,
    embedder = "mobilenet",
    half = True,
    bgr = True,
    embedder_gpu = True,
    embedder_model_name = None,
    embedder_wts = None,
    polygon = False,
    today = None
)