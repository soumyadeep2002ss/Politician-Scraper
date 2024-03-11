import csv
import json
import time
from dotenv import load_dotenv
import google.generativeai as genai
import os
import re
import sys
load_dotenv()

character_limit = 120000

# Load JSON data from file
with open("../Politicians/csv_results.json", "r", encoding="utf-8") as f:
    json_data = json.load(f)

with open("../Politicians/all_search_results.json", "r", encoding="utf-8") as f:
    urls_json_data = json.load(f)


def read_and_combine_text_files(folder_path, field):
    combined_text = ""
    values_list = []
    for filename in os.listdir(folder_path):
        if field == "CV" and filename.endswith(".json"):
            try:
                with open(
                    os.path.join(folder_path, filename), "r", encoding="utf-8"
                ) as json_file:
                    data = json.load(json_file)
                    if isinstance(data, dict):
                        for value in data.values():
                            values_list.append(value)
            except Exception as e:
                print(f"Error reading file {filename}: {e}")

        if filename.endswith(".txt"):
            try:
                with open(
                    os.path.join(folder_path, filename), "r", encoding="utf-8"
                ) as file:
                    combined_text += file.read() + "\n"
            except Exception as e:
                print(f"Error reading file {filename}: {e}")
    if values_list:
        values_string = "\n".join(map(str, values_list))
    else:
        values_string = ""

    return combined_text, values_string


def query_using_gemini(text, politician, api_keys):
    for api_key in api_keys:
        try:
            # Assuming genai.configure is a function call you've defined elsewhere to set up your API key.
            genai.configure(api_key=api_key)
            politician_details = politician["Name"]

            prompt = f"""
            You are analyseBOT, an award-winning data analyst, who can extract all the required information from a given text. 
            You will be given a text, extracted from various sources, about a person PERSON_PEP.
            From the given text your task is to extract the following information: FIELDS_SET about the PERSON_PEP from the CONTEXT_TEXT text.
            If no data is present related to any field, return the value for that key as 'NA'. 
            It might be possible that the information is not given directly in the provided text, you might need to analyse. 

            Here is an example of what you are expected to do:
            EXAMPLE:
            PERSON_PEP: "Yasutoshi Nishimura",
            FIELDS_SET: "Gender", "Nationality", "Citizenship", "Languages", "Dob_Year", "Dob_Month", "Dob_Day", "Address_Postal_Code", "Address_Country", "Address_Provinance", "Address_City", "Address_Address1"

            CONTEXT_TEXT: "Yasutoshi Nishimura (西村 康稔, Nishimura Yasutoshi, born October 15, 1962) is a Japanese politician who served as the Minister of Economy, Trade and Industry from August 2022 until December 2023. Nishimura previously served as Minister of State for Economy...

            EXPECTED_OUTPUT :
            
            "Address_Postal_Code": "796001",
            "Address_Country": "India",
            "Address_Provinance": "Mizoram",
            "Address_City": "Aizwal",
            "Address_Address1": "General Headquarters, Treasury Square",
            "Dob_Year": "1962",
            "Dob_Month": "October",
            "Dob_Day": "15",
            "Gender": "Male",
            "Nationality": "Japan",
            "Citizenship": "Japan",
            "Languages": "Japanese"
            

            —--- end of example—-----

            Now for the following PERSON_PEP, FIELDS_SET and CONTEXT_TEXT, generate the EXPECTED_OUTPUT in json format.
            PERSON_PEP: "{politician_details}"

            FIELDS_SET="Gender, Nationality, Citizenship, Languages, Dob_Year, Dob_Month, Dob_Day, Address_Postal_Code, Address_Country, Address_Provinance, Address_City, Address_Address1",

            CONTEXT_TEXT: "{text}"
            """.strip()

            # Debugging: print the prompt before sending it
            print("Sending the following prompt to Gemini:")
            print(prompt)
            sys.stdout.flush()  # Ensure the output is immediately visible

            model = genai.GenerativeModel("gemini-pro")
            messages = [{"role": "user", "parts": [prompt]}]
            safety_settings = [
                {"category": "HARM_CATEGORY_DANGEROUS", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
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

            # Debugging: print the response received
            print("Received response from Gemini:")
            # Print the first 500 characters of the response
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
                return (
                    "NA",
                    f"{politician['Position_Description']}",
                    "NA",
                    "NA",
                    "NA",
                    "NA",
                    "NA",
                    "NA",
                    "NA",
                    "NA",
                    "NA",
                    "NA",
                    "NA"
                )
            # print(response_data)
            (
                address_postal_code,
                address_country,
                address_provinance,
                address_city,
                address_address1,
                positions,
                dob_year,
                dob_month,
                dob_day,
                nationality,
                citizenship,
                language,
                gender,
            ) = (
                "NA",
                f"{politician['Position_Description']}",
                "NA",
                "NA",
                "NA",
                "NA",
                "NA",
                "NA",
                "NA",
                "NA",
                "NA",
                "NA",
                "NA",
            )
            if isinstance(response_data, dict):
                address_postal_code = response_data.get(
                    "Address_Postal_Code", "NA")
                address_country = response_data.get("Address_Country", "NA")
                address_provinance = response_data.get(
                    "Address_Provinance", "NA")
                address_city = response_data.get("Address_City", "NA")
                address_address1 = response_data.get("Address_Address1", "NA")

                get_positions = response_data.get('Positions held so far')
                if isinstance(get_positions, list):
                    positions = '\n'.join(get_positions)
                dob_year = response_data.get("Dob_Year", "NA")
                dob_month = response_data.get("Dob_Month", "NA")
                dob_day = response_data.get("Dob_Day", "NA")
                nationality = response_data.get('Nationality', 'NA')
                citizenship = response_data.get('Citizenship', 'NA')
                get_language = response_data.get('Languages', 'NA')
                if isinstance(get_language, list):
                    language = '\n'.join(get_language)
                gender = response_data.get('Gender', 'NA')

            if positions.strip() == "" or positions.strip() == "NA":
                positions = f"{politician['Position_Description']}"

            return address_postal_code, address_country, address_provinance, address_city, address_address1, positions, dob_year, dob_month, dob_day, nationality, citizenship, gender, language

        except Exception as e:
            print(f"Error querying with API key {api_key}: {e}")
            print("Retrying with a different API key...")
            time.sleep(3)  # Add a delay before retrying
            continue

    # If all API keys fail, return a default value or raise an exception
    return "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA", "NA"


# Fields to extract
fields = ["CV", "Address", "Data di nascita", "Date of birth", "Positions"]
# Make these filed dynamic ############# Yatharth
# csv_fields = ["Address", "Date of birth", "Positions", "Non-Readable CV",
#               "Nationality", "Citizenship", "Languages", "Gender", "Source URLs"]
csv_fields = [
    "Address_Postal_Code",
    "Address_Country",
    "Address_Provinance",
    "Address_City",
    "Address_Address1",
    "Positions",
    "Dob_Year",
    "Dob_Month",
    "Dob_Day",
    "Gender",
    "Non-Readable CV",
    "Nationality",
    "Citizenship",
    "Languages",
    "Gender",
    "Source URLs",
]

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
    writer = csv.DictWriter(
        file, fieldnames=['UniqueId', 'Politician', 'Country'] + csv_fields)
    writer.writeheader()
    # # Write the row to the CSV file
    # writer.writerow(row)

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

    politician = json_data[politician_folder]
    api_keys_to_try = api_keys[i % len(
        api_keys):] + api_keys[:i % len(api_keys)]  # Rotate the list
    (
        extracted_address_postal_code,
        extracted_address_country,
        extracted_address_provinance,
        extracted_address_city,
        extracted_address_address1,
        extracted_positions,
        extracted_dob_year,
        extracted_dob_month,
        extracted_dob_day,
        extracted_nationality,
        extracted_citizenship,
        extracted_gender,
        extracted_languages
    ) = query_using_gemini(combined_text, politician, api_keys_to_try)
    politician_data["Address_Postal_Code"] = extracted_address_postal_code
    politician_data["Address_Country"] = extracted_address_country
    politician_data["Address_Provinance"] = extracted_address_provinance
    politician_data["Address_City"] = extracted_address_city
    politician_data["Address_Address1"] = extracted_address_address1
    politician_data['Positions'] = extracted_positions
    politician_data["Dob_Year"] = extracted_dob_year
    politician_data["Dob_Month"] = extracted_dob_month
    politician_data["Dob_Day"] = extracted_dob_day
    politician_data['Gender'] = extracted_gender

    politician_data['Non-Readable CV'] = non_readable_cv_links
    politician_data['Gender'] = extracted_gender
    politician_data['Nationality'] = extracted_nationality
    politician_data['Citizenship'] = extracted_citizenship
    politician_data['Languages'] = extracted_languages

    category_urls_list = []
    for category, urls in urls_json_data[politician_folder].items():
        unique_urls = set(urls)
        category_urls_string = f"{category}: [\n" + \
            ",\n".join(f"'{url}'" for url in unique_urls) + "\n]"
        category_urls_list.append(category_urls_string)
    final_urls_string = "\n\n".join(category_urls_list)
    politician_data['Source URLs'] = final_urls_string

    politician_data['UniqueId'] = politician_folder
    politician_data['Politician'] = json_data[politician_folder]['Name']
    politician_data['Country'] = json_data[politician_folder]['Country']

    # Prepare the row with politician's name and extracted data
    # row = {'UniqueId': politician_folder, 'Politician': json_data[politician_folder]['Name'], 'Country': json_data[politician_folder]['Country']}
    # row.update(politician_data)

    with open(csv_file, 'a', newline='', encoding='utf-8') as f_object:
        dictwriter_object = csv.DictWriter(
            f_object, fieldnames=['UniqueId', 'Politician', 'Country'] + csv_fields)
        dictwriter_object.writerow(politician_data)
        f_object.close()

print("Data extraction complete. CSV file created.")
