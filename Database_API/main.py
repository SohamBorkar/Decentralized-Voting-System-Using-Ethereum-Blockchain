# Import required modules
import dotenv
import os
import mysql.connector
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from mysql.connector import errorcode
import jwt
import uuid
from pydantic import BaseModel

# Loading the environment variables
dotenv.load_dotenv()

# Initialize the todoapi app
app = FastAPI()

# Define the data model for registration
class UserRegistration(BaseModel):
    full_name: str
    aadhar_card: str
    epic_number: str
    password: str

# Define the allowed origins for CORS
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to the MySQL database
try:
    cnx = mysql.connector.connect(
        user=os.environ['MYSQL_USER'],
        password=os.environ['MYSQL_PASSWORD'],
        host=os.environ['MYSQL_HOST'],
        database=os.environ['MYSQL_DB'],
    )
    cursor = cnx.cursor()
    
    # Create voter_details table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS voter_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            voter_id CHAR(36),
            full_name VARCHAR(100),
            aadhar_card VARCHAR(12) UNIQUE,
            epic_number VARCHAR(20) UNIQUE,
            FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE
        )
    ''')
    cnx.commit()
except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with your user name or password")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print(err)

# Define the authentication middleware
async def authenticate(request: Request):
    try:
        api_key = request.headers.get('authorization').replace("Bearer ", "")
        cursor.execute("SELECT * FROM voters WHERE voter_id = %s", (api_key,))
        if api_key not in [row[0] for row in cursor.fetchall()]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Forbidden"
            )
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Forbidden"
        )

# Define the POST endpoint for login
@app.get("/login")
async def login(request: Request, voter_id: str, password: str):
    await authenticate(request)
    role = await get_role(voter_id, password)

    # Assuming authentication is successful, generate a token
    token = jwt.encode({'password': password, 'voter_id': voter_id, 'role': role}, os.environ['SECRET_KEY'], algorithm='HS256')

    return {'token': token, 'role': role}

# Define the POST endpoint for registration
@app.post("/register")
async def register(user: UserRegistration):
    try:
        # Check if aadhar_card or epic_number already exists
        cursor.execute("SELECT * FROM voter_details WHERE aadhar_card = %s OR epic_number = %s", 
                      (user.aadhar_card, user.epic_number))
        existing_user = cursor.fetchone()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this Aadhar Card or EPIC Number already exists"
            )
        
        # Generate a UUID for the new user
        voter_id = str(uuid.uuid4())
        
        # Insert into voters table
        cursor.execute("INSERT INTO voters (voter_id, role, password) VALUES (%s, %s, %s)",
                      (voter_id, 'user', user.password))
        
        # Insert into voter_details table
        cursor.execute("INSERT INTO voter_details (voter_id, full_name, aadhar_card, epic_number) VALUES (%s, %s, %s, %s)",
                      (voter_id, user.full_name, user.aadhar_card, user.epic_number))
        
        # Commit the transaction
        cnx.commit()
        
        return {"voter_id": voter_id, "message": "Registration successful"}
    
    except mysql.connector.Error as err:
        cnx.rollback()
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(err)}"
        )
    except HTTPException as ex:
        raise ex
    except Exception as e:
        cnx.rollback()
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

# Replace 'admin' with the actual role based on authentication
async def get_role(voter_id, password):
    try:
        cursor.execute("SELECT role FROM voters WHERE voter_id = %s AND password = %s", (voter_id, password,))
        role = cursor.fetchone()
        if role:
            return role[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid voter id or password"
            )
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
