import os
import csv
import google.generativeai as genai

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

def query_openai(text, field, politician):
    GOOGLE_API_KEY = 'GOOGLE_API_KEY'  # add your GOOGLE_API_KEY
    genai.configure(api_key=GOOGLE_API_KEY)

    prompt = f"For the person {politician} extract the following field of information: {field}\n from the following text [if no information related to the field is present, return NA]: \n{text}"
    model = genai.GenerativeModel('gemini-pro')
    messages = [
        {'role':'user', 'parts': [prompt]}
    ]
    response = model.generate_content(messages)
    print(response.text)
    return response.text

# fields
fields = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"]

main_folder_path = main_folder_path = 'path_to_output' # path to the main folder
 # path to the main folder

# holds all extracted data
all_extracted_data = {}

# Iterating through each politician's folder
for politician_folder in os.listdir(main_folder_path):
    politician_data = {field: '' for field in fields}
    # print(politician_folder)

    for field in fields:
        folder_path = os.path.join(main_folder_path, politician_folder, field)
        if os.path.isdir(folder_path):
            combined_text = read_and_combine_text_files(folder_path)
            extracted_data = query_openai(combined_text, field, politician_folder)
            politician_data[field] = extracted_data  

    all_extracted_data[politician_folder] = politician_data      


csv_file = 'extracted_politician_data.csv'
with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.DictWriter(file, fieldnames=['Politician'] + fields)
    writer.writeheader()
    for politician, data in all_extracted_data.items():
        row = {'Politician': politician}
        row.update(data)
        writer.writerow(row)

print("Data extraction complete. CSV file created.")