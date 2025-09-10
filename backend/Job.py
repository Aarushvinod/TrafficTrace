from VehicleDetector import YoloDetector
import TrafficMonitoring as helpers

class Job:

    def __init__(self, vehicle_detection_model, accident_detection_model, video_name):
        self.object_detector = YoloDetector(vehicle_detection_model, accident_detection_model)
        self.video_capture, self.video_writer = helpers.init_reader_writer(video_name)


