import csv
import json
import time
from dotenv import load_dotenv
import google.generativeai as genai
import os
from genderCheck.gender_extraction import identify_gender_from_file

load_dotenv()

# Load JSON data from file
with open('../Politicians/csv_results.json', "r") as f:
    json_data = json.load(f)

def read_and_combine_text_files(folder_path):
    combined_text = ''
    for filename in os.listdir(folder_path):
        if filename.endswith('.txt'):
            try:
                with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as file:
                    combined_text += file.read() + "\n"
            except Exception as e:
                print(f"Error reading file {filename}: {e}")
    return combined_text

def query_using_gemini(text, field, politician, api_keys):
    for api_key in api_keys:
        try:
            genai.configure(api_key=api_key)
            politician_details = f"{politician['Name']} {politician['Country']} {politician['Position_Description']}"
            prompt = f"""For the person {politician_details}, extract the following field of information: {field}
            [If your response consists of phrases like 'I apologize' or 'I'm sorry', replace your response with 'NA'.
            If no information is available, return NA.
            If the response is 'provided data is not available' or 'The provided text does not contain information about...', replace the output with 'NA'.]: \n{text}"""
            model = genai.GenerativeModel('gemini-pro')
            messages = [{'role': 'user', 'parts': [prompt]}]
            safety_settings = [
                {"category": "HARM_CATEGORY_DANGEROUS", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            response = model.generate_content(messages, safety_settings=safety_settings)
            print(response.text)
            return response.text
        except Exception as e:
            print(f"Error querying with API key {api_key}: {e}")
            print("Retrying with a different API key...")
            time.sleep(3)  # Add a delay before retrying
            continue

    # If all API keys fail, return a default value or raise an exception
    return "NA"

# Fields to extract
fields = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"]

# Directory paths
llm_directory = os.path.dirname(__file__)
main_folder_path = os.path.join(llm_directory, '..', 'Politicians', 'Output')

# List of API keys
api_keys = [
    os.getenv(f'GOOGLE_API_KEY{i}') for i in range(1, 6)
]

# Output CSV file
csv_file = 'extracted_politician_data1.csv'

# Open the CSV file in write mode
with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.DictWriter(file, fieldnames=['Politician'] + fields)
    writer.writeheader()

    # Iterate through each politician's folder
    for politician_folder in os.listdir(main_folder_path):
        politician_data = {field: '' for field in fields}
        
        # Iterate through each field for the politician
        for i, field in enumerate(fields):
            folder_path = os.path.join(main_folder_path, politician_folder, field)
            if os.path.isdir(folder_path):
                combined_text = read_and_combine_text_files(folder_path)
                politician = json_data[politician_folder]
                api_keys_to_try = api_keys[i % len(api_keys):] + api_keys[:i % len(api_keys)]  # Rotate the list
                extracted_data = query_using_gemini(combined_text, field, politician, api_keys_to_try)
                politician_data[field] = extracted_data
        
        # Prepare the row with politician's name and extracted data
        row = {'Politician': json_data[politician_folder]['Name']}
        row.update(politician_data)
        
        # Write the row to the CSV file
        writer.writerow(row)

print("Data extraction complete. CSV file created.")
