import streamlit as st
import pandas as pd
import json
import websocket
import requests

# Function to handle WebSocket messages


def on_message(ws, message):
    data = json.loads(message)
    st.json(data)

# Function to handle WebSocket errors


def on_error(ws, error):
    st.error(f"WebSocket error: {error}")

# Function to handle WebSocket connection close


def on_close(ws, close_status_code, close_msg):
    st.warning("WebSocket closed")

# Function to set up WebSocket connection


def connect_websocket():
    ws = websocket.WebSocketApp(
        "ws://localhost:3000", on_message=on_message, on_error=on_error, on_close=on_close)
    return ws

# Streamlit app


def main():
    st.title("WebSocket Streamlit App")

    # Upload CSV file
    uploaded_file = st.file_uploader("Upload CSV", type=["csv"])
    if uploaded_file is not None:
        # Display instructions
        st.markdown("### Instructions:")
        st.text("1. Upload a CSV file.")
        st.text(
            "2. Click the 'Start Scraping' button to trigger scraping via WebSocket after uploading.")
        st.text("3. Alternatively, click the 'Start Scraping (API)' button to trigger scraping via API after uploading.")

        # Display uploaded CSV data
        # st.subheader("Uploaded CSV Data:")
        # df = pd.read_csv(uploaded_file)
        # st.dataframe(df)
        # Trigger scraping via WebSocket after uploading
        if st.button("Start Scraping (WebSocket)"):
            st.info("WebSocket: Scraping started. Please wait for updates.")

            # Read CSV file
            df = pd.read_csv(uploaded_file)

            # Connect to WebSocket
            ws = connect_websocket()
            ws_thread = ws.run_forever()

            # Send WebSocket message with CSV data
            ws.send(df.to_json(orient="records"))

            # Close WebSocket connection after sending the data
            ws.close()

            while ws_thread.is_alive():
                message = ws.recv()
                if message:
                    data = json.loads(message)
                    st.json(data)

        # Trigger scraping via API after uploading
        if st.button("Start Scraping (API)"):
            st.info("API: Scraping started. Please wait for updates.")

            # Send CSV file to the scraping API endpoint
            files = {"csvFile": uploaded_file}
            response = requests.post(
                "http://localhost:3000/scrape", files=files)

            if response.status_code == 200:
                st.success("API: Scraping started successfully.")
            else:
                st.error(
                    f"API: Error in request - {response.status_code} - {response.text}")


if __name__ == "__main__":
    main()
