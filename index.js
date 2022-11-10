const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

const uri =
  "mongodb+srv://serviceUser:TvWGHwfaYlb4DkYr@cluster0.2xrlof8.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const serviceCollection = client.db("service-review").collection("service");
    const reviewCollection = client.db("service-review").collection("review");

    function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = authHeader.split(" ")[1];

      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        function (err, decoded) {
          if (err) {
            return res.status(403).send({ message: "Forbidden access" });
          }
          req.decoded = decoded;
          next();
        }
      );
    }

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    app.get("/", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).limit(3);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/all-services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };
      const reviewQuery = {};
      const serviceItem = await serviceCollection.findOne(query);
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      let specificReviews = [];
      reviews.forEach((review) => {
        if (review.service == id) {
          specificReviews.push(review);
        }
      });
      const data = {
        serviceItem,
        specificReviews,
      };
      res.send(data);
    });

    app.get("/myreviews", verifyJWT, async (req, res) => {
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      let myReviews = [];
      reviews.forEach((review) => {
        if (review.reviewerID == req.query.userID) {
          myReviews.push(review);
        }
      });
      res.send(myReviews);
    });
    app.get("/myreviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
    });
    app.put("/myreviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const review = req.body;
      console.log(review);
      const option = { upsert: true };
      const updatedReview = {
        $set: {
          service: review.service,
          reviewerID: review.reviewerID,
          name: review.name,
          reviewText: review.reviewText,
        },
      };
      const result = await reviewCollection.updateOne(
        filter,
        updatedReview,
        option
      );
      res.send(result);
    });

    app.post("/reviewsubmit", verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.delete("/myreviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.listen(port, () => {
  console.log(`Listeing to port ${port}`);
});
