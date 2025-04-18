const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts);

window.App = {
  init: async function() {
    try {
      // Connect to Ethereum and load contract
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      VotingContract.setProvider(window.ethereum);
      VotingContract.defaults({from: window.ethereum.selectedAddress, gas: 6654755});

      // Display user account
      App.account = window.ethereum.selectedAddress;
      $("#accountAddress").html("Your Account: " + window.ethereum.selectedAddress);

      // Load and display results
      await App.loadResults();

      // Set up back button
      App.setupBackButton();
    } catch (error) {
      console.error("Initialization error:", error);
    }
  },

  loadResults: async function() {
    try {
      const instance = await VotingContract.deployed();

      // Get voting dates
      const dates = await instance.getDates();
      const startDate = new Date(dates[0] * 1000);
      const endDate = new Date(dates[1] * 1000);
      $("#dates").text(startDate.toDateString() + " - " + endDate.toDateString());

      // Get total candidates
      const countCandidates = await instance.getCountCandidates();
      
      // Calculate total votes and display candidates
      let totalVotes = 0;
      const candidates = [];

      // First pass to get all candidate data and calculate total votes
      for (let i = 1; i <= countCandidates; i++) {
        const candidateData = await instance.getCandidate(i);
        const id = candidateData[0].toNumber();
        const name = candidateData[1];
        const party = candidateData[2];
        const voteCount = candidateData[3].toNumber();
        
        candidates.push({ id, name, party, voteCount });
        totalVotes += voteCount;
      }

      // Update the total vote count display
      $("#totalVoteCount").text(totalVotes);

      // Second pass to calculate percentages and render
      $("#boxResults").empty();
      candidates.forEach(candidate => {
        const percentage = totalVotes > 0 ? (candidate.voteCount / totalVotes * 100).toFixed(2) : "0.00";
        
        const row = `
          <tr>
            <td>${candidate.name}</td>
            <td>${candidate.party}</td>
            <td>${candidate.voteCount}</td>
            <td>${percentage}%</td>
            <td>
              <div class="progress-bar" style="width: ${percentage}%"></div>
            </td>
          </tr>
        `;
        
        $("#boxResults").append(row);
      });
    } catch (error) {
      console.error("Error loading results:", error);
      $("#boxResults").html("<tr><td colspan='5'>Error loading results. Please try again later.</td></tr>");
    }
  },

  setupBackButton: function() {
    // Check the source page from the query parameter and set up the back button appropriately
    const urlParams = new URLSearchParams(window.location.search);
    const fromPage = urlParams.get('from');
    const token = urlParams.get('Authorization');
    
    $("#backButton").click(function() {
      if (fromPage === 'admin') {
        window.location.href = `/admin.html?Authorization=${token}`;
      } else {
        window.location.href = `/index.html?Authorization=${token}`;
      }
    });
  }
};

window.addEventListener("load", function() {
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask");
    window.eth = new Web3(window.ethereum);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545.");
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }
  
  window.App.init();
}); 