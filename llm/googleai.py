import os
import csv
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
f = open('../Politicians/csv_results.json', "r")
json_data = json.loads(f.read())

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

def  query_using_gemini(text, field, politician, api_key):
    genai.configure(api_key=api_key)
    politician_name = politician['Name']
    politician_country = politician['Country']
    politician_position = politician['Position_Description']
    politician_details = politician_name + " " + politician_country + " " + politician_position
    prompt = f"""For the person {politician_details} extract the following field of information: {field}\n from the following text 
    [If your response consists of responses like 'I apologize' or 'I'm sorry', replace your response with 'NA' entirely. 
    If no information is available, simply return NA.
    Whenever your response is similar to 'provided data is not available' or 'The provided text does not contain information about...', replace the output with 'NA'.
    If no such data can be extracted or retrieved from the provided text, return 'NA'.]: \n{text}"""
    model = genai.GenerativeModel('gemini-pro')
    messages = [
        {'role':'user', 'parts': [prompt]}
    ]
    safety_settings = [
        {
            "category": "HARM_CATEGORY_DANGEROUS",
            "threshold": "BLOCK_NONE",
        },
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE",
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE",
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE",
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE",
        },
    ]
    response = model.generate_content(
        messages, safety_settings=safety_settings)
    print(response.text)
    return response.text

# fields
fields = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"]

llm_directory = os.path.dirname(__file__)

# Construct the main folder path relative to the script directory
main_folder_path = os.path.join(llm_directory, '..', 'Politicians', 'Output')

# List of API keys
api_keys = [
    os.getenv('GOOGLE_API_KEY1'),
    os.getenv('GOOGLE_API_KEY2'),
    os.getenv('GOOGLE_API_KEY3'),
    os.getenv('GOOGLE_API_KEY4'),
    os.getenv('GOOGLE_API_KEY5'),
    os.getenv('GOOGLE_API_KEY6'),
]  

csv_file = 'extracted_politician_data.csv'

# Open the CSV file in write mode
with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.DictWriter(file, fieldnames=['Politician'] + fields)
    writer.writeheader()

    # Iterating through each politician's folder
    for politician_folder in os.listdir(main_folder_path):
        politician_data = {field: '' for field in fields}
        # Iterating through each field for the politician
        for i, field in enumerate(fields):
            folder_path = os.path.join(main_folder_path, politician_folder, field)
            if os.path.isdir(folder_path):
                combined_text = read_and_combine_text_files(folder_path)
                politician = json_data[politician_folder]
                api_key = api_keys[i % len(api_keys)]  # Rotate through the list of API keys
                # print(api_key)
                extracted_data = query_using_gemini(combined_text, field, politician, api_key)
                politician_data[field] = extracted_data
        # Preparing the row with politician's name and extracted data
        row = {'Politician': json_data[politician_folder]['Name']}
        row.update(politician_data)
        # Writing the row to the CSV file
        writer.writerow(row)
