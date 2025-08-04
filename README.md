# Set up the Feature Flag Manager
1. Git clone this repository into an independent directory (not within your existing application)
2. In the terminal, navigate to this directory (evaluation-api) and run `npm install`
3. Check the package.json file in the backend directory for available scripts
4. At the top level of the "backend" directory, create a `.env` file containing the following:
    ```
    DB_USER=<Your database username>
    DB_PASSWORD=<Your database password> 
    DB_HOST=<Your database host>
    DB_NAME=flag_manager
    TABLE_NAME=flags
    DB_PORT=<Your DB Port, currently set to 5432> 
    API_PORT=<The API Port, currently set to 3000>
    ```
5. To run the server, navigate to the directory in the terminal and enter `npm run dev`. 
    If you run into Node version issues, switch to Node version 20.19.0 or later. 
6. This will start the server locally in development. 