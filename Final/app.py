from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import csv
import json
import time
from dotenv import load_dotenv
import google.generativeai as genai
import os
import re
import sys
import shutil

load_dotenv()
character_limit = 120000

app = Flask(__name__, static_folder="static")

# Define a global variable to track the progress status
is_progress_running = False


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify(error="No file part"), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify(error="No selected file"), 400
    if file:
        # Specify the path to the folder outside the current directory

        # Set the new filename
        new_filename = "sample.csv"
        # Combine the target directory and new filename to create the full file path
        filepath = os.path.join(new_filename)
        # Save the uploaded file to the new filepath
        file.save(filepath)
        return jsonify(status="File uploaded", filepath=filepath), 200


@app.route("/run-node", methods=["POST"])
def run_node_script():
    directory_path = 'Output'
    csv_file_path = 'extracted_politician_data.csv'
    # Check if the directory exists
    if os.path.exists(directory_path):
        # Remove the directory if it exists
        shutil.rmtree(directory_path)
        print(f"Directory '{directory_path}' removed successfully.")

     # Check if the CSV file exists
    if os.path.exists(csv_file_path):
        # Remove the CSV file if it exists
        os.remove(csv_file_path)
        print(f"File '{csv_file_path}' removed successfully.")

    global is_progress_running

    # Check if progress is already running
    if is_progress_running:
        return jsonify(status="Progress is already running."), 200
    # Set progress status to running
    is_progress_running = True
    # Navigate to the directory containing your Node.js project
    # Run the npm start command
    result = subprocess.run(
        ["/home/ubuntu/.nvm/versions/node/v18.19.0/bin/node", "index.js"], capture_output=True, text=True)
    # Optionally, navigate back to the original directory if needed
    # os.chdir(original_directory)

    if result.returncode == 0:
        # Example: subprocess.run(['python', 'your_python_script.py', 'arg1', 'arg2'])
        # Load JSON data from file
        with open("csv_results.json", "r", encoding="utf-8") as f:
            json_data = json.load(f)

        with open("all_search_results.json", "r", encoding="utf-8") as f:
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
                    You are analyseBOT, an award-winning data analyst, who can extract all the required information from a given text. \n
                    You will be given a text, extracted from various sources, about a person PERSON_PEP.\n
                    From the given text your task is to extract the following information: FIELDS_SET about the PERSON_PEP from the CONTEXT_TEXT text.
                    If no data is present related to any field, return the value for that key as 'NA'. \n
                    The information will not be given directly in the text, you will analyze the text and extract the information for the FIELDS_SET for the PERSON_PEP.
                    For the Address fields in FIELDS_SET , print office address if personal address is not there in the CONTEXT_TEXT for PERSON_PEP.\n
        \n\n
                    Here is an example of what you are expected to do:\n
                    EXAMPLE:\n
                    PERSON_PEP: "Yasutoshi Nishimura",\n
                    FIELDS_SET: "Gender", "Nationality", "Citizenship", "Languages", "Dob_Year", "Dob_Month", "Dob_Day", "Address_Postal_Code", "Address_Country", "Address_Provinance", "Address_City", "Address_Address1"
        \n
                    CONTEXT_TEXT: "CONTEXT_TEXT: “Yasutoshi Nishimura (西村 康稔, Nishimura Yasutoshi, born October 15, 1962) is a Japanese politician who served as the Minister of Economy, Trade and Industry from August 2022 until December 2023.[2] Nishimura previously served as Minister of State for Econom


    Early life and career


    Nishimura with Urmas Paet (January 31, 2014)


    Nishimura with Shinzō Abe (October 29, 2019)
    A native of Akashi, Hyōgo and a relative of Akira Fukida, a former Minister of Home Affairs, Nishimura graduated from the University of Tokyo, Faculty of Law in 1985.[5]


    Minister of Economy, Trade and Industry
    In office


    Prime Minister  Shinzō Abe
    Yoshihide Suga
    Preceded by Toshimitsu Motegi
    Succeeded by    Daishiro Yamagiwa
    Member of the House of Representatives
    Incumbent

    Personal details
    Born    15 October 1962 (age 61)
    Akashi, Hyōgo, Japan
    Currently lives in General Headquarters, Treasury Square, Aizawl-796001 (Mizoram)


    Political party Liberal Democratic Party
    Alma mater  Tokyo University




    Nishimura was running for the LDP presidential elections which was held September 28, 2009, and came in third after Sadakazu Tanigaki, who was elected, and Kōno Tarō.[7][8] In the 2021 presidential election, Nishimura was the lead sponsor for Sanae Takaishi.[9]”

        \n
                    EXPECTED_OUTPUT :\n
                    
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
                    
        \n
                    —--- end of example—-----

                    Now for the following PERSON_PEP, FIELDS_SET and CONTEXT_TEXT, generate the EXPECTED_OUTPUT in json format.\n
                    PERSON_PEP: "{politician_details}"\n

                    FIELDS_SET="Gender, Nationality, Citizenship, Languages, Dob_Year, Dob_Month, Dob_Day, Address_Postal_Code, Address_Country, Address_Provinance, Address_City, Address_Address1",
        \n
                    CONTEXT_TEXT: "{text}"
                    """.strip()

                    # Debugging: print the prompt before sending it
                    print("Sending the following prompt to Gemini:")
                    print(prompt)
                    sys.stdout.flush()  # Ensure the output is immediately visible

                    model = genai.GenerativeModel("gemini-pro")
                    messages = [{"role": "user", "parts": [prompt]}]
                    safety_settings = [
                        {"category": "HARM_CATEGORY_DANGEROUS",
                            "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_HARASSMENT",
                            "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH",
                            "threshold": "BLOCK_NONE"},
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
                        address_country = response_data.get(
                            "Address_Country", "NA")
                        address_provinance = response_data.get(
                            "Address_Provinance", "NA")
                        address_city = response_data.get("Address_City", "NA")
                        address_address1 = response_data.get(
                            "Address_Address1", "NA")

                        get_positions = response_data.get(
                            'Positions held so far')
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
        fields = ["CV", "Address", "Data di nascita",
                  "Date of birth", "Positions"]
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
        main_folder_path = os.path.join('Output')

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
                folder_path = os.path.join(
                    main_folder_path, politician_folder, f)
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
        # Set progress status to not running
        is_progress_running = False
        return jsonify(status="Python script completed"), 200

    else:
        return jsonify(status="Node script failed", error=result.stderr), 500


# @app.route("/run-python", methods=["POST"])


@app.route("/download-csv", methods=["GET"])
def download_csv():
    """
    Endpoint to download the extracted_politician_data.csv file.
    """
    # Define the path to the CSV file
    # Get the directory where the app is running
    directory = os.path.dirname(__file__)
    filename = "extracted_politician_data.csv"  # The name of your CSV file

    try:
        # Attempt to send the file
        return send_from_directory(directory, filename, as_attachment=True)
    except FileNotFoundError:
        # If the file was not found, return a 404 error
        return jsonify(error="File not found."), 404


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


if __name__ == "__main__":
    app.run(port=8080, debug=True)
