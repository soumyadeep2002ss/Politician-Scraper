# import pandas as pd

# def merge_csv_files(file1, file2, file3, file4, output_file):
#     # Read CSV files
#     df1 = pd.read_csv(file1)
#     df2 = pd.read_csv(file2)
#     df3 = pd.read_csv(file3)
#     df4 = pd.read_csv(file4)

#     # Create a list of DataFrames
#     dfs = [df1, df2, df3, df4]

#     # Merge DataFrames based on the 'UniqueId' column
#     merged_df = pd.concat(dfs, keys=['file1', 'file2', 'file3', 'file4'], sort=False)

#     # Replace 'NA' values with non-'NA' values from the longest cell among all four CSV files
#     for column in merged_df.columns:
#         merged_df[column] = merged_df.groupby(level=1)[column].transform(
#             lambda x: x.ffill().bfill().apply(lambda y: y if pd.notna(y) else max(x, key=len) if any(pd.notna(val) for val in x) else y)
#         )

#     # Keep only the rows from the last DataFrame ('file4')
#     merged_df = merged_df.xs('file4')

#     # Write the merged DataFrame to a new CSV file
#     merged_df.to_csv(output_file, index=False)

# # Example usage:
# file1 = 'extracted_politician_data.csv'
# file2 = 'extracted_politician_data1.csv'
# file3 = 'extracted_politician_data2.csv'
# file4 = 'extracted_politician_data3.csv'
# output_file = 'merged_output.csv'

# merge_csv_files(file1, file2, file3, file4, output_file)


# import pandas as pd

# def merge_csv_files(file1, file2, file3, file4, output_file):
#     # Set option to handle NaN values
#     pd.set_option('mode.use_inf_as_na', True)

#     # Read CSV files
#     df1 = pd.read_csv(file1)
#     df2 = pd.read_csv(file2)
#     df3 = pd.read_csv(file3)
#     df4 = pd.read_csv(file4)

#     # Create a list of DataFrames
#     dfs = [df1, df2, df3, df4]

#     # Merge DataFrames based on the 'UniqueId' column
#     merged_df = pd.concat(dfs, keys=['file1', 'file2', 'file3', 'file4'], sort=False)

#     # Replace 'NA' values with non-'NA' values from the longest cell among all four CSV files
#     for column in merged_df.columns:
#         merged_df[column] = merged_df.groupby(level=1)[column].transform(
#             lambda x: x.ffill().bfill().apply(lambda y: y if pd.notna(y) else max(x, key=len) if any(pd.notna(val) for val in x) else y)
#         )

#     # Check if 'Date of birth' values are different among CSV files and not NA
#     merged_df['Multiple_dates'] = merged_df.groupby('UniqueId')['Date of birth'].transform(
#         lambda x: x.duplicated(keep=False) & ~x.isna()
#     )

#     # Keep only the rows from the last DataFrame ('file4')
#     merged_df = merged_df.xs('file4')

#     # Write the merged DataFrame to a new CSV file
#     merged_df.to_csv(output_file, index=False)

#     # Reset the option to its default value
#     pd.set_option('mode.use_inf_as_na', None)

# # Example usage:
# file1 = 'extracted_politician_data.csv'
# file2 = 'extracted_politician_data1.csv'
# file3 = 'extracted_politician_data2.csv'
# file4 = 'extracted_politician_data3.csv'
# output_file = 'merged_output.csv'

# merge_csv_files(file1, file2, file3, file4, output_file)



import pandas as pd

def merge_csv_files(file1, file2, file3, file4, output_file):
    # Set option to handle NaN values
    pd.set_option('mode.use_inf_as_na', True)

    # Read CSV files
    df1 = pd.read_csv(file1)
    df2 = pd.read_csv(file2)
    df3 = pd.read_csv(file3)
    df4 = pd.read_csv(file4)

    # Create a list of DataFrames
    dfs = [df1, df2, df3, df4]

    # Merge DataFrames based on the 'UniqueId' column
    merged_df = pd.concat(dfs, keys=['file1', 'file2', 'file3', 'file4'], sort=False)

    # Replace 'NA' values with non-'NA' values from the longest cell among all four CSV files
    for column in merged_df.columns:
        merged_df[column] = merged_df.groupby(level=1)[column].transform(
            lambda x: x.ffill().bfill().apply(lambda y: y if pd.notna(y) else max(x, key=len) if any(pd.notna(val) for val in x) else y)
        )

    # Check if 'Date of birth' values are different among CSV files and not NA
    merged_df['Multiple_dates'] = merged_df.groupby('UniqueId')['Date of birth'].transform(
        lambda x: x.nunique() > 1 and ~x.isna()
    )

    # Include all 'Date of birth' values from each CSV file in a new line only if they are different
    merged_df['Date of birth'] = merged_df.groupby('UniqueId')['Date of birth'].transform(
        lambda x: '\n'.join(x.dropna().unique()) if x.nunique() > 1 and ~x.isna().all() else x.dropna().max()
    )

    # Keep only the rows from the last DataFrame ('file4')
    merged_df = merged_df.xs('file4')

    # Write the merged DataFrame to a new CSV file
    merged_df.to_csv(output_file, index=False)

    # Reset the option to its default value
    pd.set_option('mode.use_inf_as_na', None)

# Example usage:
file1 = 'extracted_politician_data.csv'
file2 = 'extracted_politician_data1.csv'
file3 = 'extracted_politician_data2.csv'
file4 = 'extracted_politician_data3.csv'
output_file = 'merged_output.csv'

merge_csv_files(file1, file2, file3, file4, output_file)
