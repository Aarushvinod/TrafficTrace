from flask import Flask, render_template, jsonify, abort
from pathlib import Path
from Job import Job
from ultralytics import YOLO
import torch


app = Flask(__name__)
vehicle_detection_model, accident_detection_model, jobs = None, None, None
with app.app_context():
    def load_model(file_path):
        curr_model = YOLO(file_path)
        curr_model.fuse()
        curr_model.to('cuda' if torch.cuda.is_available() else 'cpu')
        return curr_model
    vehicle_detection_model = load_model("models/yolov11m.pt")
    accident_detection_model = load_model("models/AccidentDetection.pt")
    jobs = dict()
        
@app.route('/')
def home_page():
    return render_template(Path(__file__).parents[1] / "frontend/public/index.html")

@app.route('/get_job', methods = ['GET', 'POST'])
def get_job():
    new_job = Job(vehicle_detection_model, accident_detection_model)
    jobs[new_job.get_job_id()] = new_job
    return jsonify({'job_id' : new_job.get_job_id()})

@app.route('/distance_estimation', methods=['GET'])
def stream_distance_estimation():
    pass

@app.route('/distance_estimation/<string:job_id>/speed/<int:speed_limit>', methods = ['GET'])
def get_report(job_id, speed_limit):
    if job_id not in jobs:
        abort(404, 'No job was created using the provided id')
    final_report = {"report" : jobs[job_id].generate_report(speed_limit)}
    return jsonify(final_report)
    

    
