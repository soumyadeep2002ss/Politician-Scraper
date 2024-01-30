# import os
# import csv
# from dotenv import load_dotenv
# import google.generativeai as genai

# load_dotenv()

# def read_and_combine_text_files(folder_path):
#     combined_text = ''
#     for filename in os.listdir(folder_path):
#         if filename.endswith('.txt'):
#             try:
#                 with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as file:
#                     combined_text += file.read() + "\n"
#             except Exception as e:
#                 print(f"Error reading file {filename}: {e}")
#     return combined_text

# def  query_using_gemini(text, field, politician):
#     GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')  # add your GOOGLE_API_KEY
#     genai.configure(api_key=GOOGLE_API_KEY)

#     prompt = f"For the person {politician} extract the following field of information: {field}\n from the following text [if no information related to the field is present, return NA]: \n{text}"
#     model = genai.GenerativeModel('gemini-pro')
#     messages = [
#         {'role':'user', 'parts': [prompt]}
#     ]
#     response = model.generate_content(messages)
#     print(response.text)
#     return response.text

# # fields
# fields = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"]

# llm_directory = os.path.dirname(__file__)

# # Construct the main folder path relative to the script directory
# main_folder_path = os.path.join(llm_directory, '..', 'Politicians', 'Output1')
#  # path to the main folder

# # holds all extracted data
# all_extracted_data = {}

# # Iterating through each politician's folder
# for politician_folder in os.listdir(main_folder_path):
#     politician_data = {field: '' for field in fields}
#     # print(politician_folder)

#     for field in fields:
#         folder_path = os.path.join(main_folder_path, politician_folder, field)
#         if os.path.isdir(folder_path):
#             combined_text = read_and_combine_text_files(folder_path)
#             extracted_data =  query_using_gemini(combined_text, field, politician_folder)
#             politician_data[field] = extracted_data

#     all_extracted_data[politician_folder] = politician_data


# csv_file = 'extracted_politician_data.csv'
# with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
#     writer = csv.DictWriter(file, fieldnames=['Politician'] + fields)
#     writer.writeheader()
#     for politician, data in all_extracted_data.items():
#         row = {'Politician': politician}
#         row.update(data)
#         writer.writerow(row)

# print("Data extraction complete. CSV file created.")

import os
import csv
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()


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


def query_using_gemini(text, field, politician, api_key):
    genai.configure(api_key=api_key)

    prompt = f"For the person {politician} extract the following field of information: {field}\n from the following text [if no information related to the field is present, return NA]: \n{text}"
    model = genai.GenerativeModel('gemini-pro')
    messages = [
        {'role': 'user', 'parts': [prompt]}
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
    # print(response.prompt_feedback)
    return response.text


# fields
fields = ["address", "dob", "deceased date", "sex",
          "languages", "citizenship", "nationality", "occupation"]

llm_directory = os.path.dirname(__file__)

# Construct the main folder path relative to the script directory
main_folder_path = os.path.join(llm_directory, '..', 'Politicians', 'Output')
# path to the main folder

# List of API keys
api_keys = [
    os.getenv('GOOGLE_API_KEY1'),
    os.getenv('GOOGLE_API_KEY2'),
    os.getenv('GOOGLE_API_KEY3'),
    os.getenv('GOOGLE_API_KEY4'),
    os.getenv('GOOGLE_API_KEY5'),
    os.getenv('GOOGLE_API_KEY6'),
]

# holds all extracted data
all_extracted_data = {}

# Iterating through each politician's folder
for politician_folder in os.listdir(main_folder_path):
    politician_data = {field: '' for field in fields}
    
    for i, field in enumerate(fields):
        folder_path = os.path.join(main_folder_path, politician_folder, field)
        if os.path.isdir(folder_path):
            combined_text = read_and_combine_text_files(folder_path)
            # Rotate through the list of API keys
            api_key = api_keys[i % len(api_keys)]
            # print(api_key)
            extracted_data = query_using_gemini(
                combined_text, field, politician_folder, api_key)
            politician_data[field] = extracted_data
    
    # Save to CSV after completing extraction for each politician
    csv_file = 'extracted_politician_data.csv'
    with open(csv_file, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=['Politician'] + fields)
        if file.tell() == 0:  # Check if the file is empty
            writer.writeheader()
        row = {'Politician': politician_folder}
        row.update(politician_data)
        writer.writerow(row)

    all_extracted_data[politician_folder] = politician_data

print("Data extraction complete. CSV file created.")
