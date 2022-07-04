//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const log = console.log

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://tangsiw3:test@cluster0.4zfha.mongodb.net/todolistDB', {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Study'
})

const defaultItems = [item1]

const listSchema = {
  name: String,
  items: [itemsSchema]
} 

const list = mongoose.model('list', listSchema)

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          log(err)
        }else{
          log('default list saves successfully')
        }
      })
      foundItems = defaultItems;
    }
    res.render("list", {listTitle: 'Today', newListItems: foundItems});
  })

})

app.get('/:customListName', function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  list.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        // create a new list
        const customeList = new list({
          name: customListName,
          items: defaultItems
        })
        customeList.save()
        res.redirect('/' + customListName)
      }else{
        // show exist list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
})

app.post('/', function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  log(listName)
  const item = new Item({
    name: itemName
  })
  if(listName === 'Today'){
    item.save();
    res.redirect('/')
  }else{
    list.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName)
    })
  }
})

app.post('/delete', function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === 'Today'){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        log(err)
      }else{
        log('delete successfully');
        res.redirect('/')
      }
    })
  }else{
    list.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect('/' + listName)
      }
    })
  }
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
    console.log("Server started successfully.");
});