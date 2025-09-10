from ultralytics import YOLO
import cv2

class YoloDetector:

    def __init__(self, vehicle_model, accident_model):
        self.vehicle_model: YOLO = vehicle_model
        self.accident_model: YOLO = accident_model
        
        self.original_frames = list()
        self.annotated_frames = list()
        
        self.wanted_names = {'bicycle', 'car', 'motorbike', 'bus', 'truck'}
        self.cache = list()
        self.pixel_distance = None
        self.car_length = 14.7 #Average Car Length: 14.7 ft
        self.car_width = 5.8 #Average Car Width: 5.8ft
    
    def draw_detection(self, frame, detection):
        x1, y1, x2, y2, curr_confidence, class_name = detection
        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 2)
        cv2.putText(frame, f'{class_name}: {curr_confidence}', (int(x1), int(y1)-8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

    def accidents(self, frame):
        collected_accidents = list()
        results = self.accident_detector(frame, verbose=False)
        for result in results:
            for data in result.boxes.data.tolist():
                x1, y1, x2, y2, curr_confidence, class_id = data
                class_id = int(class_id)
                class_name = self.accident_model.names[class_id]
                self.draw_detection(frame, (x1, y1, x2, y2, curr_confidence, class_name))
                if class_name=="moderate" and curr_confidence>0.85 or class_name=="severe" and curr_confidence>0.9:
                  collected_accidents.append(([x1, y1, x2-x1, y2-y1], curr_confidence, class_name))
        return collected_accidents

    def report_detections(self, frame_no):
        return self.cache[frame_no]
    
    def report_estimation_and_detections(self, frame, confidence):
        results = self.model(frame, verbose=False)
        self.original_frames.append(frame.copy())
        detections = list()
        frame_score = 0, car_count = 0
        for result in results:
            for data in result.boxes.data.tolist():
                x1, y1, x2, y2, curr_confidence, class_id = data
                class_id = int(class_id)
                class_name = self.model.names[class_id]
                self.draw_detection(frame, (x1, y1, x2, y2, curr_confidence, class_name))
                if curr_confidence > confidence and class_name in self.wanted_names:
                    detections.append(([x1, y1, x2-x1, y2-y1], curr_confidence, class_name))
                    if class_name == "car":
                        car_count += 1
                        dy = y2-y1, dx = x2-x1
                        length_ratio = self.car_length/dy if dy>dx else self.car_length/dx
                        width_ratio = self.car_width/dy if dy<dx else self.car_length/dx
                        frame_score += (length_ratio + width_ratio)/2
        self.cache.append(detections)
        self.annotated_frames.append(frame)
        return frame_score/car_count if car_count!=0 else 0

    def vehicle_count(self, vehicle_names):
        final_count = dict()
        for track_id in vehicle_names:
            curr_name = vehicle_names[track_id][0]
            if curr_name in self.wanted_names:
                if curr_name not in final_count:
                    final_count[curr_name] = 1
                else:
                    final_count[curr_name] += 1
        return final_count