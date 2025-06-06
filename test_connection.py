import snowflake.connector
import os
from dotenv import load_dotenv

load_dotenv()

print(f"Testing connection with:")
print(f"User: {os.getenv('SNOWFLAKE_USER')}")
print(f"Account: {os.getenv('SNOWFLAKE_ACCOUNT')}")

try:
    conn = snowflake.connector.connect(
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        account=os.getenv('SNOWFLAKE_ACCOUNT'),
        warehouse='COMPUTE_WH',
        database='ASHESI_HANDBOOK',
        schema='PUBLIC'
    )
    print("✅ Connection successful!")
    
    # Test query
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM ASHESI_HANDBOOK_SECTIONS")
    result = cursor.fetchone()
    print(f"✅ Found {result[0]} rows in your handbook table!")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
