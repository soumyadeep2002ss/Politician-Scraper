import pdfplumber
import openai
import json

import google.generativeai as genai


def extract_text_from_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = ''
        for page in pdf.pages:
            text += page.extract_text()
    return text


def query_openai(text):
    GOOGLE_API_KEY = 'AIzaSyDd26SvuTQqx5kIW50llUWnWCMtP4bZpWg'  # add your GOOGLE_API_KEY
    genai.configure(api_key=GOOGLE_API_KEY)

    prompt = f"""Given the following text, extract and format the name, address, and position of the politician:

Text:
{text}

Instructions:
- The name should be formatted as "Name: [politician's name]"
- The address should be formatted as "Address: [politician's address]"
- The position should be formatted as "Position: [politician's position]"
"""
    model = genai.GenerativeModel('gemini-pro')
    messages = [
        {'role': 'user',
         'parts': [prompt]}
    ]
    response = model.generate_content(messages)

    # Sending request to OpenAI
    # response = openai.Completion.create(
    #     engine="gpt-3.5-turbo-instruct",
    #     prompt=prompt,
    #     max_tokens=150
    # )

    # return response.choices[0].text.strip()
    print(response.text)
    return response


# add the path to your PDF
pdf_path = 'Christopher G Cavolli_test.pdf'

text = extract_text_from_pdf(pdf_path)

extracted_data = query_openai(text)
# print(extracted_data)

# Convert to JSON format (or further process as needed)
# json_data = json.loads(extracted_data)
# print(json.dumps(json_data, indent=4))
