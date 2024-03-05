import json
import csv
import base64
from genderCheck.gender_extraction import identify_gender_from_base64


def process_json(json_data):
    # Create a CSV file to store the results
    with open('output.csv', 'w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile)
        # Write the header row
        csv_writer.writerow(['id', 'gender'])

        for unique_id, data in json_data.items():
            # Check if 'Images' field is empty
            images = data.get('Images', [])
            if not images:
                # If no images, write NA to the CSV and continue to the next record
                csv_writer.writerow([unique_id, 'NA'])
                continue

            # Iterate over the 'Images' field in each section
            for image_url in images:
                # Extract base64 data from the image URL
                image_data = image_url
                # print(image_data)
                genders = identify_gender_from_base64(image_data)
                print(genders)

                if not genders:
                    # No face detected
                    gender = 'NA'
                elif len(genders) == 1:
                    # Single face detected
                    gender = genders[0]
                else:
                    # Multiple faces detected
                    gender = 'Multiple faces detected'
                    print(gender)

                print(unique_id)
                # Write the result to CSV
                csv_writer.writerow([unique_id, gender])


# Load JSON data from the file
with open('../Politicians/all_search_results.json', "r", encoding='utf-8') as f:
    json_data = json.load(f)

# Process the JSON data and write to CSV
process_json(json_data)
