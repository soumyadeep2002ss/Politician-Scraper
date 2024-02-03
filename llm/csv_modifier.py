import pandas as pd
import re

df = pd.read_csv('extracted_politician_data.csv')

# Define the keywords to search for
keywords = ['sorry', 'apologize', 'apologize', 'provide', 'unable to', 'does not', 'not available', 'cannot', ' no information', 'extract', 'retrieve', 'not listed', 'not found']

pattern = re.compile('|'.join(keywords), re.IGNORECASE)

def replace_with_na(cell):
    if isinstance(cell, str) and pattern.search(cell):
        print(cell)
        return 'NA'
    if isinstance(cell, str):
        return cell
    return 'NA'

for column in df.columns:
    df[column] = df[column].apply(replace_with_na)

df.to_csv('modified_file.csv', index=False)
