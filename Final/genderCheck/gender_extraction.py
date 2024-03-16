import os
import cv2
import numpy as np
import base64

import requests


def identify_gender_from_base64(base64_image):
    # Check if the base64 string includes the data URI scheme and strip it if present
    if base64_image.startswith("data:image"):
        # Find the start of the base64 string
        base64_str_idx = base64_image.find("base64,") + 7
        # Extract the actual base64 string
        base64_image = base64_image[base64_str_idx:]
    else:
        base64_image = image_url_to_base64(base64_image)
        if base64_image is None:
            print("Invalid base64 image.")
            return []
        base64_str_idx = base64_image.find("base64,") + 7
        base64_image = base64_image[base64_str_idx:]

    # Decode base64 image to a NumPy array
    image_data = base64.b64decode(base64_image)
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Ensure the image was decoded successfully
    if image is None:
        print("Failed to decode the image.")
        return []

    # Get the absolute path of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Use the absolute path to construct the file paths
    face_model = os.path.join(script_dir, "opencv_face_detector_uint8.pb")
    face_config = os.path.join(script_dir, "opencv_face_detector.pbtxt")
    gender_model = os.path.join(script_dir, "gender_net.caffemodel")
    gender_config = os.path.join(script_dir, "gender_deploy.prototxt")

    # Model mean values
    MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)

    # Gender list
    genders = ["Male", "Female"]

    # Load models
    face_net = cv2.dnn.readNet(face_model, face_config)
    gender_net = cv2.dnn.readNet(gender_model, gender_config)

    # Perform face detection
    blob = cv2.dnn.blobFromImage(image, 1.0, (300, 300), [
                                 104, 117, 123], True, False)
    face_net.setInput(blob)
    detections = face_net.forward()
    face_boxes = []

    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > 0.7:
            x1 = int(detections[0, 0, i, 3] * image.shape[1])
            y1 = int(detections[0, 0, i, 4] * image.shape[0])
            x2 = int(detections[0, 0, i, 5] * image.shape[1])
            y2 = int(detections[0, 0, i, 6] * image.shape[0])
            face_boxes.append([x1, y1, x2, y2])

    # Identify gender for detected faces
    genders_detected = []
    for box in face_boxes:
        face = image[
            max(0, box[1] - 15): min(box[3] + 15, image.shape[0] - 1),
            max(0, box[0] - 15): min(box[2] + 15, image.shape[1] - 1),
        ]
        if face.size == 0:
            print("Warning: Empty face image detected. Skipping.")
            continue
        blob = cv2.dnn.blobFromImage(
            face, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False
        )
        gender_net.setInput(blob)
        gender_preds = gender_net.forward()
        gender = genders[gender_preds[0].argmax()]
        genders_detected.append(gender)

    return genders_detected


def image_url_to_base64(image_url):
    try:
        # Fetch the image from the URL
        response = requests.get(image_url)
        # Convert the image data to base64
        base64_image = base64.b64encode(response.content).decode("utf-8")
        # Create a data URI for the image
        data_uri = f"data:image/jpeg;base64,{base64_image}"
        return data_uri
    except Exception as e:
        print(f"Error converting image URL to base64: {e}")
        return None

# image_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaZjpIkwnI9aTOKBk5KRJ31ohlIlDYHcrGiJGhuM2W1eQhlq3N5aarjN5P6NigMt3dDv4&usqp=CAU"
# print(image_url)
# Example usage with a base64 image string
# Make sure to replace the base64_image_string with your actual base64 string
# base64_image_string = ""
# genders_result = identify_gender_from_base64(image_url)
# print("Genders detected:", genders_result)
