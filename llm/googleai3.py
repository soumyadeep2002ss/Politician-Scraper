import csv
import json
import time
from dotenv import load_dotenv
import google.generativeai as genai
import os
import re

load_dotenv()

character_limit = 120000

# Load JSON data from file
with open('../Politicians/csv_results.json', "r") as f:
    json_data = json.load(f)


def read_and_combine_text_files(folder_path, field):
    combined_text = ''
    values_list = []
    for filename in os.listdir(folder_path):
        if field == "CV" and filename.endswith('.json'):
            try:
                with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as json_file:
                    data = json.load(json_file)
                    if isinstance(data, dict):
                        for value in data.values():
                            values_list.append(value)
            except Exception as e:
                print(f"Error reading file {filename}: {e}")

        if filename.endswith('.txt'):
            try:
                with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as file:
                    combined_text += file.read() + "\n"
            except Exception as e:
                print(f"Error reading file {filename}: {e}")
    if values_list:
        values_string = '\n'.join(map(str, values_list))
    else:
        values_string = ''

    return combined_text, values_string


def query_using_gemini(text, politician, api_keys):
    for api_key in api_keys:
        try:
            # text = text[:character_limit]
            genai.configure(api_key=api_key)
            politician_details = f"{politician['Name']}"
            prompt = f"""You are a chatbot, capable of analysing data and answering questions related to the provided data, and you give me only the answer in key-value pairs in json format and translate to english whatever the text language then use that text for extraction. Now, I have the following text about the subject '{politician_details}'; analyse the given text and give me the information about the fields : 'Address', 'Date of Birth' and 'Positions held so far' in key-value pairs in english. 
            For the field 'Address', if no address is available, you have to return the address of the current office the subject works in, which is available in the text, you need to properly analyse the text. 
            For the field 'Positions held so far', return only the positions in the form of a list, no need to return the duration or date when the positions were held.
            If no data is present related to any field, return the value for that key as 'NA'. 
            It might be possible that the information is not given directly in the provided text, you might need to analyse. 
            Here is the text: {text}"""
            model = genai.GenerativeModel('gemini-pro')
            messages = [{'role': 'user', 'parts': [prompt]}]
            safety_settings = [
                {"category": "HARM_CATEGORY_DANGEROUS", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"},
            ]
            response = model.generate_content(
                messages, safety_settings=safety_settings)
            print(response.text)
            json_match = re.search(r'\{[\s\S]*\}', response.text)
            # print(json_match)
            response_data = {}
            if json_match:
                # Extract the matched JSON string
                json_string = json_match.group(0)
                # Now you can load it as a JSON object
                response_data = json.loads(json_string)
            else:
                print("No JSON data found in the response.")
                return "NA", f"{politician['Position_Description']}", "NA"
            # print(response_data)
            address, positions, date_of_birth = "NA", f"{politician['Position_Description']}", "NA"
            if isinstance(response_data, dict):
                address = response_data.get('Address', 'NA')
                get_positions = response_data.get('Positions held so far')
                if isinstance(get_positions, list):
                    positions = '\n'.join(get_positions)
                date_of_birth = response_data.get('Date of Birth', 'NA')

            if positions.strip() == "" or positions.strip() == "NA":
                positions = f"{politician['Position_Description']}"

            return address, positions, date_of_birth

        except Exception as e:
            print(f"Error querying with API key {api_key}: {e}")
            print("Retrying with a different API key...")
            time.sleep(3)  # Add a delay before retrying
            continue

    # If all API keys fail, return a default value or raise an exception
    return "NA", "NA", "NA"


# Fields to extract
fields = ["CV", "Address", "Data di nascita", "Date of birth", "Positions"]
csv_fields = ["Address", "Date of birth", "Positions", "Non-Readable CV"]

# Directory paths
llm_directory = os.path.dirname(__file__)
main_folder_path = os.path.join(llm_directory, '..', 'Politicians', 'Output')

# List of API keys
api_keys = [
    os.getenv(f'GOOGLE_API_KEY{i}') for i in range(1, 6)
]

# Output CSV file
csv_file = 'extracted_politician_data.csv'

# Open the CSV file in write mode
with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.DictWriter(file, fieldnames=['Politician'] + csv_fields)
    writer.writeheader()

    # Iterate through each politician's folder
    for i, politician_folder in enumerate(os.listdir(main_folder_path)):
        politician_data = {field: '' for field in csv_fields}

        # Iterate through each field for the politician
        combined_text = ''
        non_readable_cv_links = 'NA'
        for f in fields:
            folder_path = os.path.join(main_folder_path, politician_folder, f)
            if os.path.isdir(folder_path):
                to_be_combined_text, non_extractable_cv_values = read_and_combine_text_files(
                    folder_path, f)
                combined_text += to_be_combined_text
                if f == "CV" and non_extractable_cv_values is not None:
                    non_readable_cv_links = non_extractable_cv_values

        # file_path = os.path.join(llm_directory, '..', 'llm', 'file.txt')
        # with open(file_path, 'w', encoding='utf-8') as file:
        #     file.write(combined_text)

        politician = json_data[politician_folder]
        api_keys_to_try = api_keys[i % len(
            api_keys):] + api_keys[:i % len(api_keys)]  # Rotate the list
        extracted_address, extracted_positions, extracted_dob = query_using_gemini(
            combined_text, politician, api_keys_to_try)
        politician_data['Address'] = extracted_address
        politician_data['Positions'] = extracted_positions
        politician_data['Date of birth'] = extracted_dob
        politician_data['Non-Readable CV'] = non_readable_cv_links

        # Prepare the row with politician's name and extracted data
        row = {'Politician': json_data[politician_folder]['Name']}
        row.update(politician_data)

        # Write the row to the CSV file
        writer.writerow(row)

print("Data extraction complete. CSV file created.")
