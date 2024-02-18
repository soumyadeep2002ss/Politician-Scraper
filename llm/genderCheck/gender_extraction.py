import cv2
import os
import glob


def identify_gender_from_file(image_name):
    # Define the path to the 'images' folder
    folder_path = os.path.join(os.path.dirname(__file__), "images")

    # Search for the image file in the 'images' folder with common image extensions
    possible_extensions = ["jpg", "jpeg", "png"]
    found_files = []
    for extension in possible_extensions:
        found_files.extend(
            glob.glob(os.path.join(folder_path, f"{image_name}.{extension}"))
        )

    if not found_files:
        print("Image file not found.")
        return []

    image_path = found_files[0]  # Use the first found image
    image = cv2.imread(image_path)

    # Ensure the image was read successfully
    if image is None:
        print("Failed to read the image file.")
        return []

    # Pre-trained model files paths
    face_model = "opencv_face_detector_uint8.pb"
    face_config = "opencv_face_detector.pbtxt"
    gender_model = "gender_net.caffemodel"
    gender_config = "gender_deploy.prototxt"

    # Model mean values
    MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)

    # Gender list
    genders = ["Male", "Female"]

    # Load models
    face_net = cv2.dnn.readNet(face_model, face_config)
    gender_net = cv2.dnn.readNet(gender_model, gender_config)

    # Perform face detection
    blob = cv2.dnn.blobFromImage(image, 1.0, (300, 300), [104, 117, 123], True, False)
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
            max(0, box[1] - 15) : min(box[3] + 15, image.shape[0] - 1),
            max(0, box[0] - 15) : min(box[2] + 15, image.shape[1] - 1),
        ]
        blob = cv2.dnn.blobFromImage(
            face, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False
        )
        gender_net.setInput(blob)
        gender_preds = gender_net.forward()
        gender = genders[gender_preds[0].argmax()]
        genders_detected.append(gender)

    return genders_detected


# Example usage:
image_name = 'imgMJ'
genders = identify_gender_from_file(image_name)
print(genders)
