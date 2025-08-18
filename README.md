# 🚗 Car Rental API with Flutterwave Integration

This project is a simple **Node.js + Express API** for renting cars in Nigeria with **Flutterwave payment integration**.  

The flow:
1. User selects a car and provides booking details.
2. API creates a **payment link** using Flutterwave.
3. User is redirected to Flutterwave checkout.
4. Flutterwave redirects the user back to your app after payment.

---

## 🔧 Setup

### 1. Clone repo
```bash
git clone https://github.com/your-username/car-rental-api.git
cd car-rental-api
```

### 2. install dependencies 
```bash
npm install .
```

### 3. Add environment variables 
create a .env file
```
#Flutterwave confinguration
PUBLIC_KEY=FLWPUBKK_TEST-xxxxxxxxxxxxx-X
SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxx-X

#Application Configuration
MONGO_URL= YOUR DATABASE URL
PORT=3000

# JWT Configuration
JWT_SECRET=your-256bit-secret-token
JWT_EXPIRATION=expiration-date

# Application Configuration
PORT=3000
NODE_ENV=development
```

▶️ Running the Server
```
node server.js
```
Server will start at:
```
http://localhost:3000
```

---

🚀 Endpoints

1. Rent a Car (Initiate Payment)

POST /api/cars/rent

Request body:
```
{
  "amount": "5000",
  "email": "testuser@example.com",
  "name": "Test User",
  "carId": "CAR123"
}
```
Response:
```
{
  "link": "https://sandbox.flutterwave.com/pay/iddcmlwfgd09"
}
```
Open the link in a browser to pay via Flutterwave checkout.
---

💳 Test Payments

Use the following Flutterwave test card in sandbox mode:
```
Card number: 5531 8866 5214 2950

CVV: 564

Expiry: 09/32

PIN: 3310
```
More test cards: Flutterwave Docs.
---

🔀 Redirect After Payment

In your rent request payload, you set a redirect_url.
After checkout, Flutterwave redirects the user to this URL with query parameters:

https://yourapp.com/?status=successful&tx_ref=car-rental-1692393000000&transaction_id=1234567
status → payment status (successful, cancelled, failed)
tx_ref → your transaction reference
transaction_id → id of transaction 

---


---

📄 License

MIT

---
