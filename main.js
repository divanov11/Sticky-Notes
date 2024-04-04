import './style.css'
// import data from './data.json'
import colors from './colors.json'
import { db } from './databases';
import { v4 as uuidv4 } from 'uuid';

//Great resource for drag and drop: https://devdojo.com/tnylea/how-to-drag-an-element-using-javascript
//On select, pop up 3 colors on the left side and allow a user to change the colores

let newPosX = 0, newPosY = 0, startPosX = 0, startPosY = 0;
let selected = null;

const toBeSaved = {}

async function loadData (){
    //1 - Load in data & Add Items
    const response = await db.notes.list()

    response.documents.forEach((i) => {
      addItem(i)
    })

    //Set selected element on first load
    selected = document.querySelectorAll('.card-header')[0].parentElement
}

async function addItem(item){
    item.body = JSON.parse(item.body)
    item.colors = JSON.parse(item.colors)
    item.position = JSON.parse(item.position)

      const element = `<div  class="card" style="left:${item.position.x}px;top:${item.position.y}px" data-id=${item.$id}>
                          <div  class="card-header" style="background-color:${item.colors.colorHeader};z-index="998"; data-id=${item.$id} ">
                            <svg style="z-index="1001";" id="delete-${item.$id}" data-id=${item.$id} class="delete-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" stroke="#000000" fill="none" stroke-width="1.5"><path d="m6 8 .668 8.681c.148 1.924.222 2.885.84 3.423.068.06.14.115.217.165.685.449 1.63.26 3.522-.118.36-.072.54-.108.721-.111h.064c.182.003.361.039.72.11 1.892.379 2.838.568 3.523.12.076-.05.15-.106.218-.166.617-.538.691-1.5.84-3.423L18 8"></path><path stroke-linecap="round" d="m10.151 12.5.245 3.492M13.849 12.5l-.245 3.492M4 8s4.851 1 8 1 8-1 8-1M8 5l.447-.894A2 2 0 0 1 10.237 3h3.527a2 2 0 0 1 1.789 1.106L16 5"></path></svg>
                          </div>
                          <div class="card-body"  style="background-color:${item.colors.colorBody}">
                            <textarea data-id=${item.$id} style="color:${item.colors.colorText}">${item.body}</textarea>
                          </div>
                        </div>`
                        
    app.insertAdjacentHTML('beforeend', element)

    //2 - Add event listeners - 2.1 - Delete button
    const deleteBtn = document.getElementById(`delete-${item.$id}`)
    deleteBtn.addEventListener('click', handleDelete)

    //2 - Add event listeners - 2.2 - Mouse down event for drag
    const cardHeader = Array.from(document.getElementsByClassName('card-header')).find(element => item.$id === element.dataset.id)
    cardHeader.addEventListener("mousedown", mouseDown);

    //2 - Add event listeners - 2.3 Grow textArea
    const textArea = Array.from(document.querySelectorAll('.card-body textarea')).find(element => item.$id === element.dataset.id)
    textArea.addEventListener('input', autoGrow);
    textArea.addEventListener('keyup', () => {addToQueue(textArea.dataset.id, 'body', textArea.value)});
    autoGrow.call(textArea);
}

function autoGrow() {
  this.style.height = 'auto'; // Reset the height
  this.style.height = this.scrollHeight + 'px'; // Set the new height
}

function mouseMove(e) {
  // calculate the new position
  newPosX = startPosX - e.clientX;
  newPosY = startPosY - e.clientY;

  // with each move we also want to update the start X and Y
  startPosX = e.clientX;
  startPosY = e.clientY;

  // set the element's new position:
  selected.style.top = (selected.offsetTop - newPosY) + "px";
  selected.style.left = (selected.offsetLeft - newPosX) + "px";
}

function mouseDown(e) {
     e.preventDefault()
     console.log('Mouse down triggered')
    let items = document.querySelectorAll('.card-header');
    const item = e.target

    selected =  e.target.parentElement

    startPosX = e.clientX;
    startPosY = e.clientY;

    //Move element to front end others back
    items.forEach(function (item) {
      item.parentElement.style.zIndex = 0 
    })
    
    selected.style.zIndex = 999

  //Add, event on mouse down, then remove it on mouse up
  document.addEventListener('mousemove', mouseMove);

  //NOT SURE IF THIS SHOULD BE ADDED HERE.
  document.addEventListener('mouseup', function(){
    const id = selected.dataset.id
    const lastPosition = {x:selected.style.left.replace("px", ""), y:selected.style.top.replace("px", "")}
    addToQueue(id, 'position', lastPosition)

    document.removeEventListener('mousemove', mouseMove);
  });
}

loadData()

//4 - Changing card colors
const colorButtons = document.getElementsByClassName('color')

for (let i=0; i < colorButtons.length; i++){
  const button = colorButtons[i]
  button.addEventListener('click', (e) => {
    updateButtonColor(e, colorButtons[i])
  })
}

async function updateButtonColor(e, button){
    
    const colorId = e.target.id
    const colorSettings = colors.find(color => color.id === colorId)

    try{
        //Need to update the backend and re-render element
        const head = selected.getElementsByClassName('card-header')[0]
        const body = selected.getElementsByClassName('card-body')[0]
        head.style.backgroundColor = colorSettings.colorHeader
        body.style.backgroundColor = colorSettings.colorBody

        const id = selected.dataset.id
        addToQueue(id, 'colors', colorSettings)

    }catch(error){
      alert('You need to select a card first before updating a color..')
    }
  }

//5 - Add Item
const addBtn = document.getElementById('add-btn')

addBtn.addEventListener('click', async () => {
  //1 - Create new data data & Add Item
  const payload = {
        "body":JSON.stringify(""),
        "position":JSON.stringify({
          "x":10,
          "y":50
        }),
        "colors":JSON.stringify({
          "colorHeader":"#FFEFBE",
          "colorBody":"#FFF5DF",
          "colorText":"#18181A"
        })
    }

   const id = uuidv4();
   const response = db.notes.create(payload, id)
   payload['$id'] = id

   addItem(payload)

   //2 - Add event listener
  let items = document.querySelectorAll('.card-header');
  const item = items[items.length - 1]
  selected =  item.parentElement
  item.addEventListener("mousedown", mouseDown)

  //3 - Style cards
 const textArea = item.parentElement.querySelectorAll('textarea')[0]
 textArea.addEventListener('input', autoGrow);
 console.log(textArea.dataset.id)
 textArea.addEventListener('keyup', () => {addToQueue(textArea.dataset.id, 'body', textArea.value)});
 autoGrow.call(textArea);
})

async function saveData(){
  
  delete toBeSaved['undefined'];
  Object.keys(toBeSaved).forEach(function(id) {
    console.log('toBeSaved:', toBeSaved)
    const payload = {}

    toBeSaved[id]?.['body'] !== undefined && (payload["body"] = toBeSaved[id].body)
    toBeSaved[id]?.['position'] !== undefined && (payload["position"] = toBeSaved[id].position)
    toBeSaved[id]?.['colors'] !== undefined && (payload["colors"] = toBeSaved[id].colors)

    db.notes.update(id, payload)

    delete toBeSaved[id];
   });
}

setInterval(saveData, 5000);

async function addToQueue (id, key, value){
  // key in an object literal when assiging, so we have to wrap it with brackets
  toBeSaved[id] ?  toBeSaved[id][key] = JSON.stringify(value)  : (toBeSaved[id] = {[key]:JSON.stringify(value)})
}

async function handleDelete(){
    //We delete any items with undefined for now until delete click doesnt trigger mouse click
    delete toBeSaved[this.dataset.id];

    db.notes.delete(this.dataset.id)
    //icon.header.card.remove()
    this.parentElement.parentElement.remove()
}