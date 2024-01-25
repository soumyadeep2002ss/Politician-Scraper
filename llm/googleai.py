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
    GOOGLE_API_KEY = 'GOOGLE_API_KEY' # add your GOOGLE_API_KEY
    genai.configure(api_key=GOOGLE_API_KEY)

    prompt = f"Extract the name, address, and position of the politician from the following text:\n\n{text}"
    model = genai.GenerativeModel('gemini-pro')
    messages = [
    {'role':'user',
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
pdf_path = 'Juan_Lucas_Restrepo_final.pdf'

text = extract_text_from_pdf(pdf_path)

extracted_data = query_openai(text)
# print(extracted_data)

# Convert to JSON format (or further process as needed)
# json_data = json.loads(extracted_data)
# print(json.dumps(json_data, indent=4))
