from VehicleDetector import YoloDetector
import TrafficMonitoring as helpers
from deep_sort_realtime.deepsort_tracker import DeepSort
import random, string

class Job:

    def __init__(self, vehicle_detection_model, accident_detection_model, video_name):
        self.object_detector = YoloDetector(vehicle_detection_model, accident_detection_model)
        self.video_capture, self.video_writer = helpers.init_reader_writer(video_name)
        self.job_id = None

    def get_job_id(self):
        #Generates string of length 20 with random sequence of numbers and alphabet
        #Each character has equal chance of being letter (lowercase and uppercase) or number
        #Roughly 62^20 possibilities so extremely improbable to generate two of the same job ids

        if self.job_id is not None: return self.job_id
        self.job_id = ''.join(random.choices(string.ascii_letters + string.digits, k=20))
        return self.job_id

    def run_distance_estimation(self):
        helpers.estimate_distance(self.video_capture, self.object_detector)

    def generate_report(self, speed):
        object_tracker = object_tracker = DeepSort(
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
        return helpers.generate_traffic_report(self.object_detector, self.video_writer, object_tracker, speed)

