import { default as ready } from '../../js/utils/ready';
import * as annyang from 'annyang';

if (annyang) {
  annyang.debug(true);
  // Let's define a command.
  let commands = {
    'hello': () => alert('Hello world!')
  };
  
  // Add our commands to annyang
  annyang.addCommands(commands);
  
  // Start listening.
  annyang.start();
 

  // alert(annyang.isListening());
  annyang.addCallback('errorPermissionBlocked', function() {
    console.log('There was an error!');
    // alert('There was an error!');
  });
  
} else {
  console.log("Speech Recognition is not supported");
}

ready(() => {

  const cards = document.querySelectorAll('.card');
  document.addEventListener('click', event => {
    event.preventDefault();
    cards.forEach(card => {
      annyang.abort();
      annyang.resume();
      annyang.trigger('hello');
      card.classList.toggle('active');
    })
  })
});


