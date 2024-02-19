import streamlit as st
import os

# Title of the webpage
st.title("Streamlit Drag and Drop with Dropdown")

# Creating a large drag and drop zone
uploaded_file = st.file_uploader(
    "Drag and Drop File Here",
    type=["csv"],
    accept_multiple_files=False,
    help="Upload your file",
)

# Check if a file has been uploaded
if uploaded_file is not None:
    # Display the filename of the uploaded file
    st.write("Filename:", uploaded_file.name)

    # Define the file path
    file_path = os.path.join(os.getcwd(), "sample.csv")

    # Write the uploaded file to the new path
    with open(file_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    st.success("File saved as sample.csv")

# Dropdown menu allowing multiple selections
options = ["Option 1", "Option 2", "Option 3", "Option 4"]
selected_options = st.multiselect("Choose te fields you want to extract data for", options)

# Displaying the selected options as pills with the option to remove them
if selected_options:
    st.write("Selected Options:")
    for index, option in enumerate(selected_options):
        pill_id = f"pill-{index}"
        st.markdown(
            f"""
            <style>
                .{pill_id} {{
                    display: inline-block;
                    padding: 0.25em 0.75em;
                    font-size: 0.875em;
                    font-weight: 700;
                    line-height: 1;
                    color: #ffffff;
                    text-align: center;
                    white-space: nowrap;
                    vertical-align: baseline;
                    border-radius: 10rem;
                    background-color: #007bff;
                    margin: 2px;
                }}
                .{pill_id}:hover {{
                    background-color: #0056b3;
                    cursor: pointer;
                }}
            </style>
            <span class="{pill_id}" onclick="this.remove();">{option} ×</span>
            """,
            unsafe_allow_html=True,
        )


# Button that when clicked will trigger a JavaScript function
if st.button("Get Data"):
    # JavaScript to execute
    # Here we would ideally link to your external JS file, but for demonstration, we'll define a simple function inline
    js = f"""
    <script>
    function getData(selectedOptions) {{
    console.log("Button clicked");
        alert("Selected options: " + selectedOptions.join(", "));
    }}
    
    getData({selected_options});
    </script>
    """

    # Display the JavaScript in the app
    st.markdown(js, unsafe_allow_html=True)
