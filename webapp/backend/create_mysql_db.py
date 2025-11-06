"""
Script to create the MySQL database if it doesn't exist
"""
import pymysql
import sys
import io

# Fix console encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# MySQL connection parameters
host = 'localhost'
user = 'root'
password = ''  # Change if your MySQL has a password
database = 'paintbynumbers'

try:
    # Connect to MySQL server (without specifying database)
    connection = pymysql.connect(
        host=host,
        user=user,
        password=password,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

    with connection:
        with connection.cursor() as cursor:
            # Create database
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✓ Database '{database}' created successfully (or already exists)")

            # Show databases to confirm
            cursor.execute("SHOW DATABASES LIKE 'paintbynumbers'")
            result = cursor.fetchone()
            if result:
                print(f"✓ Confirmed: Database '{database}' exists")
            else:
                print(f"✗ Error: Database '{database}' not found")
                sys.exit(1)

except pymysql.Error as e:
    print(f"✗ MySQL Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

print("\n✓ MySQL database is ready!")
print(f"Database URL: mysql+pymysql://{user}@{host}:3306/{database}?charset=utf8mb4")
