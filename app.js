//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.URL);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("item",itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

const item1 = new Item({
  name: "Welcome to your todoList"
});

const item2 = new Item({
  name: "Hit the + button to add new items"
});

const item3 = new Item({
  name: "<-- Hit the Checkbox to delete items"
});

const defaultItems = [item1,item2,item3];


app.get("/", function(req, res) {

  Item.find(function(err,foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems,function(err){
        if(err)console.log(err);
        else console.log("success");
      });
      res.redirect("/");
    }else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName==="Today"){
    newItem.save(function(err){
      res.redirect("/");
    });
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(newItem);
      foundList.save(function(err){
        res.redirect("/"+listName);
      });
    });
  }


});

app.post("/delete",function(req,res){
  const checkedItemID = req.body.checkBox;
  const listName = req.body.listName;

  if(listName=="Today"){
    Item.findByIdAndRemove(checkedItemID,function(err){
      if(!err){
        console.log("deleted");
        res.redirect("/");
      }
    });
  }else{

    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemID}}},function(err,foundList){
      if(!err)res.redirect("/"+listName);
    })
  }



})

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  // console.log(customListName);
  if(customListName!=="Favicon.ico"){
    List.findOne({name:customListName},function(err,foundList){
      if(!err){
        if(!foundList){
          //create new list
          const list=new List({
            name: customListName,
            items: defaultItems
          });
          list.save(function(err){
            res.redirect("/"+customListName);
          });
        }
        else{
          //show an existing list

          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      }
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started successfully");
});
