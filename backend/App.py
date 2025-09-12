from flask import Flask, jsonify, abort, Response, request
from Job import Job
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import torch
from TrafficMonitoring import estimate_distance
import os


app = Flask(__name__)
ALLOWED_EXTENSIONS = {'mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv'}
vehicle_detection_model, accident_detection_model, jobs = None, None, None
app.config['UPLOAD_FOLDER'] = '/uploads'
with app.app_context():
    def load_model(file_path):
        curr_model = YOLO(file_path)
        curr_model.fuse()
        curr_model.to('cuda' if torch.cuda.is_available() else 'cpu')
        return curr_model
    vehicle_detection_model = load_model("models/yolov11m.pt")
    accident_detection_model = load_model("models/AccidentDetection.pt")
    jobs = dict()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/get_job', methods = ['GET', 'POST'])
def get_job():
    if request.method == 'POST':
        if 'file' not in request.files or (file := request.files['file']).filename == '':
            abort(404, "No video was uploaded for analysis")
        if allowed_file(file.filename):
            filename = secure_filename(request.files['file'].filename)
            file.save(file_path := os.path.join(app.config['UPLOAD_FOLDER'], filename))
            new_job = Job(vehicle_detection_model, accident_detection_model, file_path)
            jobs[new_job.get_job_id()] = new_job
            os.remove(file_path)
            return jsonify({'job_id' : new_job.get_job_id()})

@app.route('/distance_estimation/<string:job_id>', methods=['GET'])
def stream_distance_estimation(job_id):
    if job_id not in jobs:
       abort(404, 'No job was created using the provided id')
    curr_job = jobs[job_id]
    headers = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Accel-Buffering": "no",
    }
    return Response(estimate_distance(curr_job.video_capture, curr_job.object_detector),
                    mimetype="multipart/x-mixed-replace; boundary=frame",
                    headers=headers)
    

@app.route('/final_report/<string:job_id>/speed/<int:speed_limit>', methods = ['GET'])
def get_report(job_id, speed_limit):
    if job_id not in jobs:
        abort(404, 'No job was created using the provided id')
    final_report = {"report" : jobs[job_id].generate_report(speed_limit)}
    return jsonify(final_report)
    
if __name__ == "__main__":
    app.run(debug = True, threaded = True)
    
