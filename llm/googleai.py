import os
import csv
import json
import google.generativeai as genai

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

def query_using_gemini(text, field, politician):
    GOOGLE_API_KEY = 'GOOGLE_API_KEY'  # add your GOOGLE_API_KEY
    genai.configure(api_key=GOOGLE_API_KEY)
    politician_name = politician['Name']
    politician_country = politician['Country']
    politician_position = politician['Position_Description']
    politician_details = politician_name + " " + politician_country + " " + politician_position
    prompt = f"For the person {politician_details} extract the following field of information: {field}\n from the following text [Regardless of the circumstances or potential information limitations, your requirement is to produce comprehensive responses. Utilize all provided data to its maximum potential, without resorting to disclosing its inadequacies or expressing apologies. Eliminate phrases such as 'I apologize' from your responses entirely. If no information is available, simply return NA.]: \n{text}"
    model = genai.GenerativeModel('gemini-pro')
    messages = [
        {'role':'user', 'parts': [prompt]}
    ]
    response = model.generate_content(messages)
    # print(response.text)
    return response.text

# fields
fields = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"]

# complete path to the Politicians/Output folder
main_folder_path = 'main_folder_path' 

# holds all extracted data
all_extracted_data = {}

# Iterating through each politician's folder
for politician_folder in os.listdir(main_folder_path):
    politician_data = {field: '' for field in fields}
    # print(politician_folder)

    for field in fields:
        folder_path = os.path.join(main_folder_path, politician_folder, field)
        # print(folder_path)
        if os.path.isdir(folder_path):
            combined_text = read_and_combine_text_files(folder_path)
            politician = json_data[politician_folder]
            extracted_data = query_using_gemini(combined_text, field, politician)
            politician_data[field] = extracted_data  

    all_extracted_data[politician_folder] = politician_data      


csv_file = 'extracted_politician_data.csv'
with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.DictWriter(file, fieldnames=['Politician'] + fields)
    writer.writeheader()
    for politician, data in all_extracted_data.items():
        row = {'Politician': json_data[politician]['Name']}
        row.update(data)
        writer.writerow(row)

print("Data extraction complete. CSV file created.")