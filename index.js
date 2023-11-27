const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.em2vhup.mongodb.net/?retryWrites=true&w=majority`;;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("trackifyDB").collection("users");
    const assetCollection = client.db("trackifyDB").collection("assets");
    const teamCollection = client.db("trackifyDB").collection("teams");
    const requestCollection = client.db("trackifyDB").collection("requests");
    const CustomRequestCollection = client.db("trackifyDB").collection("customRequests");


    // asset related api
    app.get('/assets', async(req, res) => {
      const result = await assetCollection.find().toArray();
      res.send(result);
  });

    app.get('/assets/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await assetCollection.findOne(query)
      res.send(result);
  });

  app.post('/assets', async(req, res) => {
      const asset = req.body;
      const result = await assetCollection.insertOne(asset);
      res.send(result);
  });

  app.delete('/assets/:id', async(req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id)};
    const result = await assetCollection.deleteOne(query);
    res.send(result);
  })

  app.patch('/assets/:id', async(req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id)};
    const { productName, productQuan, selectedType, date } = req.body;
    const updatedAsset = {
      $set: {
        productName, 
        productQuan, 
        selectedType, 
        date
      }
    }
    const result = await assetCollection.updateOne(filter, updatedAsset);
    res.send(result);
  })


    // users related api
    app.get('/users', async(req, res) => {
        const result = await userCollection.find().toArray();
        res.send(result);
    });
    app.get('/users/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await userCollection.findOne(query);
        res.send(result);
    });

    app.post('/users', async(req, res) => {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result);
    });
    app.patch('/users/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const {name, birthDate} = req.body;
      const updatedInfo = {
        $set: { 
          name,
          birthDate
        }
      };
      const result = await userCollection.updateOne(filter, updatedInfo);
      res.send(result);
    })

    // get employees
    app.get('/employees', async(req, res) => {
      const { employeeList } = req.query;
      const parsedEmployeeList = JSON.parse(employeeList);
      const emails = parsedEmployeeList.map(obj => obj.email);
      const result = await userCollection.find({ email: { $in: emails } }).toArray();
      res.send(result)
    })


    // team related api
    app.get('/teams', async(req, res) => {
      const result = await teamCollection.find().toArray();
      res.send(result);
    })

    app.post('/teams', async(req, res) => {
      const { adminEmail, teamMembers } = req.body;

      console.log("team info:", adminEmail, teamMembers);

      await userCollection.updateMany(
        { email: { $in: teamMembers } },
        { $set: { role: "employee" } }
      );

      const existingTeam = await teamCollection.findOne({ adminEmail });

      if (existingTeam) {       
          await teamCollection.updateOne(
          { adminEmail },
          { $addToSet: { teamMembers: { $each: teamMembers } } }
        );
        res.send({message: true});
      }
      else {        
        const newTeam = {
          adminEmail,
          teamMembers,
        };
        await teamCollection.insertOne(newTeam);
        res.send({message: true});
      }
    })

    app.delete('/teams/:email', async(req, res) => {
      const userEmail = req.params.email;
      const {adminEmail} = req.body;
      const query = { adminEmail: adminEmail }
      const teamData = await teamCollection.findOne(query);
      const employees = teamData.teamMembers;
      const filteredArray = employees.filter(email => email !== userEmail);
      const result = await teamCollection.updateOne(query, { $set: { teamMembers: filteredArray } });
      res.send(result);
    })

    // employee team get api
    app.get('/teams/:email', async(req, res) => {
      const employeeEmail = req.params.email;
      const teamData = await teamCollection.findOne({ teamMembers: { $elemMatch: { $eq: employeeEmail } } });
      if(!teamData){
        return res.send({message: false})
      };
      const adminEmail = teamData.adminEmail;
      const teamEmails = [adminEmail, ...teamData.teamMembers];
      const team = await userCollection.find({ email: { $in: teamEmails } }).toArray();      
      res.send(team)
    })

    // request related api
    app.get('/requests', async(req, res) => {
      const result = await requestCollection.find().toArray();
      res.send(result);
    })

    // for admin
    app.get('/requests/:email', async(req, res) => {
      const email = req.params.email;
      const query = {adminEmail: email};
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    })

    // for employee
    app.get('/requests/employee/:email', async(req, res) => {
      const email = req.params.email;
      const query = {userEmail: email};
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/requests', async(req, res) => {
      const requestedAsset = req.body;
      const result = await requestCollection.insertOne(requestedAsset);
      res.send(result);
    })

    // custom requests api
    app.get('/customRequests/:email', async(req, res) => {
      const email = req.params.email;
      const query = { adminEmail: email }
      const result = await CustomRequestCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/customRequests', async(req, res) => {
      const requestInfo = req.body;
      const result = await CustomRequestCollection.insertOne(requestInfo);
      res.send(result)
    })


    // stripe api
    app.post("/create-payment-intent", async(req, res) => {
      const {price} = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        "payment_method_types": [ "card" ],
      });
    
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res)=> {
    res.send('Tech Vibe server is running successfully...!!!')
})

app.listen(port, () => {
    console.log(`Trackify server running from: ${port}`);
})
