
from flask import Flask, render_template, send_file, request, jsonify
import os
import json
import random
from PIL import Image

app = Flask(__name__)
answer_boxes = {}
current_image = ""

# 정답 JSON 불러오기
with open("static/images/answer_boxes.json") as f:
    answer_boxes = json.load(f)

@app.route("/")
def serve_html():
    return render_template("app.html")

@app.route("/generate", methods=["GET"])
def generate_image():
    global current_image
    current_image = random.choice(list(answer_boxes.keys()))
    return jsonify({"status": "success", "image": current_image})

@app.route("/get_image/<filename>")
def serve_image(filename):
    return send_file(f"static/images/{filename}", mimetype="image/jpeg")

@app.route("/check", methods=["POST"])
def check_answer():
    data = request.json
    selected = data.get("selected", [])
    selected_set = set(selected)
    cell_size = 128
    correct_cells_total = set()
    correct_objects = 0

    # 실제 이미지 크기 불러오기
    image_path = os.path.join("static/images", current_image)
    with Image.open(image_path) as img:
        width, height = img.size
    scale_x = 512 / width
    scale_y = 512 / height

    for box in answer_boxes[current_image]:
        x1 = box["x"] * scale_x
        y1 = box["y"] * scale_y
        x2 = (box["x"] + box["width"]) * scale_x
        y2 = (box["y"] + box["height"]) * scale_y

        col_start = int(x1 // cell_size)
        col_end = int((x2 - 1) // cell_size)
        row_start = int(y1 // cell_size)
        row_end = int((y2 - 1) // cell_size)

        required_cells = {
            f"{r}_{c}" for r in range(row_start, row_end + 1)
            for c in range(col_start, col_end + 1)
        }

        correct_cells_total.update(required_cells)

        if required_cells.issubset(selected_set):
            correct_objects += 1

    required_correct = len(answer_boxes[current_image])
    enough_correct = correct_objects >= required_correct
    only_correct_selected = selected_set.issubset(correct_cells_total)

    if enough_correct and only_correct_selected:
        return jsonify({"result": "success", "correct_cells": list(correct_cells_total)})
    else:
        return jsonify({"result": "fail"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

