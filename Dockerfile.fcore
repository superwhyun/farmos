FROM python:3
WORKDIR /usr/src/app
COPY ./fcore/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY ./fcore .
CMD ["python", "fcore.py", "start"]

