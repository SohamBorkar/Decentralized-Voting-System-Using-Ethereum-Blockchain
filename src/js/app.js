//import "../css/style.css"

const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts)


window.App = {
  eventStart: function() { 
    window.ethereum.request({ method: 'eth_requestAccounts' });
    VotingContract.setProvider(window.ethereum)
    VotingContract.defaults({from: window.ethereum.selectedAddress,gas:6654755})

    // Load account data
    App.account = window.ethereum.selectedAddress;
    $("#accountAddress").html("Your Account: " + window.ethereum.selectedAddress);
    VotingContract.deployed().then(function(instance){
     instance.getCountCandidates().then(function(countCandidates){

            $(document).ready(function(){
              $('#addCandidate').click(function() {
                  var nameCandidate = $('#name').val();
                  var partyCandidate = $('#party').val();
                 instance.addCandidate(nameCandidate,partyCandidate).then(function(result){ })

            });   
              $('#addDate').click(function(){             
                  // Get the date values from the input fields
                  const startDateStr = document.getElementById("startDate").value;
                  const endDateStr = document.getElementById("endDate").value;
                  
                  if (!startDateStr || !endDateStr) {
                    alert("Please select both start and end dates");
                    return;
                  }
                  
                  // Add time component to ensure dates are set properly (noon on the selected day)
                  const startDate = Math.floor(new Date(startDateStr + "T12:00:00").getTime() / 1000);
                  const endDate = Math.floor(new Date(endDateStr + "T23:59:59").getTime() / 1000);
                  
                  // Check if dates are valid
                  if (isNaN(startDate) || isNaN(endDate)) {
                    alert("Invalid date format. Please select valid dates.");
                    return;
                  }
                  
                  // Check if end date is after start date
                  if (endDate <= startDate) {
                    alert("End date must be after start date");
                    return;
                  }
                  
                  // Get current timestamp for comparison
                  const now = Math.floor(Date.now() / 1000);
                  
                  // Check if start date is in the future (with some buffer)
                  if (startDate < now - 3600) { // Allow 1 hour buffer for blockchain processing
                    alert("Start date must be in the future");
                    return;
                  }
                  
                  console.log(`Setting voting period: ${new Date(startDate * 1000).toLocaleString()} to ${new Date(endDate * 1000).toLocaleString()}`);
                  
                  instance.setDates(startDate, endDate)
                    .then(function(result) { 
                      console.log("Voting dates set successfully");
                      alert("Voting dates set successfully");
                      
                      // Update the display
                      const startDateDisplay = new Date(startDate * 1000);
                      const endDateDisplay = new Date(endDate * 1000);
                      $("#dates").text(startDateDisplay.toDateString() + " - " + endDateDisplay.toDateString());
                    })
                    .catch(function(error) {
                      console.error("Error setting dates:", error);
                      alert("Error setting voting dates: " + (error.message || "Unknown error"));
                    });
              });     

               instance.getDates().then(function(result){
                // Convert blockchain timestamps (seconds) to JavaScript Date objects (milliseconds)
                var startDate = new Date(result[0] * 1000);
                var endDate = new Date(result[1] * 1000);

                $("#dates").text(startDate.toDateString() + " - " + endDate.toDateString());
                
                // Add timestamp debugging
                console.log("Voting start timestamp:", result[0].toString());
                console.log("Voting end timestamp:", result[1].toString());
                console.log("Current time:", Math.floor(Date.now() / 1000));
              }).catch(function(err){ 
                console.error("ERROR! " + err.message)
              });           
          });
             
          for (var i = 0; i < countCandidates; i++ ){
            instance.getCandidate(i+1).then(function(data){
              var id = data[0];
              var name = data[1];
              var party = data[2];
              var voteCount = data[3];
              var viewCandidates = `<tr><td> <input class="form-check-input" type="radio" name="candidate" value="${id}" id=${id}>` + name + "</td><td>" + party + "</td><td>" + voteCount + "</td></tr>"
              $("#boxCandidate").append(viewCandidates)
            })
        }
        
        window.countCandidates = countCandidates 
      });

      instance.checkVote().then(function (voted) {
          console.log(voted);
          if(!voted)  {
            $("#voteButton").attr("disabled", false);

          }
      });

    }).catch(function(err){ 
      console.error("ERROR! " + err.message)
    })
  },

  vote: function() {    
    var candidateID = $("input[name='candidate']:checked").val();
    if (!candidateID) {
      $("#msg").html("<p>Please vote for a candidate.</p>")
      return
    }
    
    $("#msg").html("<p>Processing your vote, please wait...</p>");
    
    VotingContract.deployed().then(function(instance){
      // Direct vote without client-side validation - let the smart contract handle date validation
      instance.vote(parseInt(candidateID)).then(function(result){
        $("#voteButton").attr("disabled", true);
        $("#msg").html("<p style='color: green;'>Your vote has been recorded successfully!</p>");
        
        // Wait a moment before reloading to show success message
        setTimeout(function() {
          window.location.reload(1);
        }, 2000);
      })
      .catch(function(err){
        // Extract the reason from the error message
        console.error("ERROR! " + err.message);
        
        let errorMessage = "An error occurred while processing your vote.";
        
        // Check for specific voting error messages from the smart contract
        if (err.message.includes("Voting is not currently active")) {
          errorMessage = "Voting is not currently active. Please check the voting dates.";
        } else if (err.message.includes("You have already voted")) {
          errorMessage = "You have already voted in this election.";
        } else if (err.message.includes("Invalid candidate ID")) {
          errorMessage = "Invalid candidate selection.";
        } else if (err.message.includes("denied transaction signature")) {
          errorMessage = "Transaction was rejected in MetaMask. Please try again.";
        }
        
        $("#msg").html(`<p style="color: red;">${errorMessage}</p>`);
      });
    }).catch(function(err){ 
      console.error("ERROR! " + err.message);
      $("#msg").html(`<p style="color: red;">Failed to connect to voting contract. Please try again.</p>`);
    });
  }
}

window.addEventListener("load", function() {
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask")
    window.eth = new Web3(window.ethereum)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"))
  }
  window.App.eventStart()
})
