const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
const { ObjectID } = require("bson");

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
      const query = { _id: ObjectID(id) };
      const reviewQuery = {};
      const serviceItem = await serviceCollection.findOne(query);
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      //   console.log(reviews);
      let specificReviews = [];
      reviews.forEach((review) => {
        if (review.service == id) {
          //   console.log(review.reviewText);
          specificReviews.push(review);
        }
      });
      const data = {
        serviceItem,
        specificReviews,
      };
      res.send(data);
    });

    app.get("/myreviews", async (req, res) => {
      //   console.log(req.query.userID);
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      let myReviews = [];
      reviews.forEach((review) => {
        console.log(review.reviewerID);
        if (review.reviewerID == req.query.userID) {
          //   console.log(review.reviewText);
          myReviews.push(review);
        }
      });
      res.send(myReviews);
    });

    app.post("/reviewsubmit", async (req, res) => {
      const review = req.body;
      //   console.log(review);
      const result = await reviewCollection.insertOne(review);
      ~res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.listen(port, () => {
  console.log(`Listeing to port ${port}`);
});
