FROM python:3.12.0

# Set the working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY Mgid/requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the entire project directory into the container
COPY . .

WORKDIR /app/Mgid

# Expose the port
EXPOSE 8001

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"] 