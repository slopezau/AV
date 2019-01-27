var SCALE = 0.1;

party_colours = {
  A: 'red',
  B: 'blue',
  C: 'orange',
  D: 'green',
  E: 'purple',
  F: 'black',
  G: 'magenta',
  H: 'cyan',
  I: 'lawngreen',
};


Array.prototype.contains = function ( needle ) {
   for (i in this) {
       if (this[i] == needle) return true;
   }
   return false;
}

function run_election() {
  ROUND = 0;
  // Clear output
  $('#out').html('');

  // Parse input
  var ballots = parse_ballots_in();

  // Run election script
  start_election(ballots);

  // Stop usual form submission
  return false;
}

$(document).ready(run_election);

function parse_ballots_in() {
  /* Parses the contents of #ballots-in which should consist of multiple lines
   * of the form
   *    prefs:n
   * where prefs is a list of preferences (characters A-I in preferred order)
   * and n is an integer representing the number of ballot papers with said preferences
   */
  var ballots = [];
  var ballots_in_text = $('#ballots-in').val();
  var ballot_pairs = ballots_in_text.replace(/ /g, '').split('\n');
  var i, len;
  for (i = 0, len = ballot_pairs.length; i < len; i++) {
    var ballot_pair = ballot_pairs[i];
    if (ballot_pair !== "") {
      var ballot = {};
      ballot_pair = ballot_pair.split(':');
      ballot.prefs = ballot_pair[0];
      ballot.n = parseInt(ballot_pair[1], 10);
      ballots.push(ballot);
    }
  }

  return ballots;
}

function start_election(ballots) {
  party_ballots = make_initial_party_ballots(ballots);

  // Assign initial votes
  party_ballots = assign_ballots(party_ballots, ballots);
  window.p = party_ballots;

  // Start the first round
  round(party_ballots);
}

function make_initial_party_ballots(ballots) {
  // Construct an initial list of parties with empty ballot lists
  var party_ballots = {};
  var i, len;
  for (i = 0, len = ballots.length; i < len; i++) {
    var ballot = ballots[i];
    // Only check the first candidate of each ballot
    // If a candidate does not appear as a first choice they are instantly eliminated
    var candidate = ballot.prefs[0];
    if (Object.keys(party_ballots).indexOf(candidate) === -1) {
      party_ballots[candidate] = [];
    }
  }
  return party_ballots;
}

function assign_ballots(party_ballots, ballots) {
  for (var i = 0, l = ballots.length; i < l; i++) {
    var ballot = ballots[i];
    party_ballots = assign_ballot(party_ballots, ballot);
  }
  return party_ballots;
}

function assign_ballot(party_ballots, ballot) {
  // Iterate through the preference list of a ballot
  // Assign the ballot to the first party possible
  for (var prefs_len = ballot.prefs.length, i = 0; i < prefs_len; i++) {
    var pref = ballot.prefs[i];
    if (party_ballots[pref] != undefined) {
      party_ballots[pref].push(ballot);
      return party_ballots;
    }
  }
  return party_ballots;
}

function count_votes(party_ballots) {
  var party_vote_nums = {};

  for (var i in party_ballots) {
    var party = party_ballots[i];
    party_vote_nums[i] = 0;
    for (var j = 0, l = party.length; j < l; j++) {
      var vote = party[j];
      party_vote_nums[i] += vote.n;
    }
  }

  return party_vote_nums;
}

function get_stats(party_vote_nums) {
  // Initialise stats for processing
  var party_vote_stats = {
    min_party: Object.keys(party_vote_nums)[0], // party with the least votes
    max_party: Object.keys(party_vote_nums)[0], // party with the most votes
    total: 0,                                   // total votes
  };

  // Loop through each party's votes
  for (var party in party_vote_nums) {
    var num = party_vote_nums[party];
    // Check if this party is the new minimum
    if (num < party_vote_nums[party_vote_stats.min_party]) {
      party_vote_stats.min_party = party;
    }
    // Check if this party is the new maximum
    if (num > party_vote_nums[party_vote_stats.max_party]) {
      party_vote_stats.max_party = party;
    }
    // Keep track of total number of votes
    party_vote_stats.total += num;
  }

  return party_vote_stats;
}

function round(party_ballots) {
	ROUND++;
  // Count up all the votes for the party_ballots
  var party_vote_nums = count_votes(party_ballots);
  var party_vote_stats = get_stats(party_vote_nums);

  window.pvn = party_vote_nums;
  window.pvs = party_vote_stats;

  render_round(party_ballots, party_vote_nums, party_vote_stats);

  // Has the leading party got more than 50% of remaining votes?
  // If so, winner!
   
  if (party_vote_nums[party_vote_stats.max_party] > party_vote_stats.total/2) {
    win_election(party_vote_stats.max_party, party_vote_nums[party_vote_stats.max_party]);
	   $('[data-toggle="popover"]').popover({
      placement: 'right',
      trigger: 'hover',
	  animation: false
   });

  }
  // Handle an edge case here.
  // What if all remaining candidates have the same number of votes?
  else if (party_vote_stats.min_party == party_vote_stats.max_party) {
    draw_election(party_ballots);
	   $('[data-toggle="popover"]').popover({
      placement: 'right',
      trigger: 'hover',
	  animation: false
   });
  }
  else {
    // Remove the party with the lowest votes and redistribute votes
    // TODO: Edge case: What if two or more party_ballots have joint lowest votes?
    //       What does legislation actually say about this?!
	announce("No candidate has the required number of votes (" +(party_vote_stats.total/2)+ ") to win. Eliminating the candidate with the lowest votes. ");
    party_ballots = redistribute(party_ballots, party_vote_stats.min_party);
    round(party_ballots);
  }
}

function redistribute(party_ballots, losing_party) {
  var valid_party_for_transfer;
  var ballots = party_ballots[losing_party];
  delete party_ballots[losing_party];
  announce("<span style='color: red;'><b>Candidate " + losing_party + "</b> has been ELIMINATED!</span>");
 for(index = 0; index < ballots.length; ++index) {
	 if(ballots[index].n > 0) {
		 pref_word = 'vote has';
	 }
	if(ballots[index].n > 1) {
		pref_word = 'votes have';
	}
		 
		 if(ballots[index].prefs.length > 1) {
			pref_party = ballots[index].prefs.replace(losing_party, '');
		 }else{
			 pref_party = 0;
		 }

			if(pref_party.length > 0) {
				valid_party_for_transfer = 0;
				for (i = 0; i < pref_party.length; i++) {
					pref_party_check = pref_party.charAt(i);
					if(party_ballots[pref_party_check]) {
						valid_party_for_transfer = pref_party_check;
					}else{
						pref_party = pref_party.replace(pref_party_check, '');
						i = i - 1;
					}
				}
			}
			if(valid_party_for_transfer && pref_party.length > 0) {
				announce(ballots[index].n+ " " + pref_word+ " been distributed to Candidate "+valid_party_for_transfer+".");
			}else if (pref_party) {
				announce(ballots[index].n+ " " + pref_word+ "  gone to Candidate "+pref_party+" but they're already eliminated and no further preferences remain.");
			}else{
				announce(ballots[index].n+ " " + pref_word+ "  been exhausted (no further preferences).");
			}
			
	 }

  return assign_ballots(party_ballots, ballots)
}

function win_election(party, num_votes) {
  announce("<span style='color: green;'><b>Candidate " + party + "</b> has WON with a total of " +num_votes+" votes!</span>");
  
}

function draw_election(party_ballots) {
  for (var party in party_ballots) {
    announce("Candidate " + party + " has drawn!");
  }
}

/*
 * ==================== RENDERING CODE ====================
 */

function render_round(party_ballots, party_vote_nums, party_vote_stats) {
  var output_div = $("div#out");
  output_div.append("<hr />");
  output_div.append("<h4>Round "+ROUND+"</h4> <p class='total_votes'>(Number of votes: "+party_vote_stats.total+")</p>");
  var graph = $("<div class='graph'/>");
  var max_col_height = party_vote_nums[party_vote_stats.max_party]/SCALE; 
  var graph_height = max_col_height + 20
  graph.css("height", graph_height);
  for (var party_name in party_ballots) {
    var party = party_ballots[party_name];

    var party_stack = render_party_stack(party, party_name);
    var party_label = render_party_label(party_name, party_vote_nums);

    var party_container = $("<div class='party-container' />");
    party_container.css("height", graph_height);
    party_container.append(party_stack);
    party_container.append(party_label);
    graph.append(party_container);
  }
  output_div.append(graph);
}

function announce(message) {
  var output_div = $("div#out");
  output_div.append("<p class='announce'>" + message + "</p>");
}

function render_party_stack(party, party_name) {
  var party_stack = $("<div class='stack' />");

  for (var i = party.length-1; i >= 0; i--) {
    var ballot = party[i];
    party_stack.append(render_ballot(ballot, party_name));
  }

  return party_stack
}

function render_party_label(party_name, party_votes) {
  var party_label_name = $("<div class='party-label-name' />");
  party_label_name.html(party_name);

  var party_colour = $("<div class='party-colour' />");
  party_colour.css("background-color", party_colours[party_name]);

  var party_label = $("<div data-toggle='popover' data-content='Total Votes: "+party_votes[party_name]+"' class='party-label' />");
  party_label.append(party_label_name);
  party_label.append(party_colour);

  return party_label;
}

function render_ballot(ballot, party_name){
  var ballot_stack = $("<div class='ballot'></div>");
  ballot_stack.css("height", ballot.n/SCALE);
  //var col_width = 99/ballot.prefs.length + "%";
  var col_width = "100%";
  // Discarded preferences only shown with half opacity
  var pref_opacity = 0.4;
  for (var i = 0, l = ballot.prefs.length; i < l; i++) {
    var pref = ballot.prefs[i];
    if (pref === party_name){
      pref_opacity = 1;
    }
	vote_text = 'vote';
	if(ballot.n > 1) {
		vote_text = 'votes';
	}
    var ballot_col = $("<div class='ballot-col' data-toggle='popover' data-content='" +ballot.n+ " " + vote_text +" allocated from Vote: " + ballot.prefs + "'></div>");
    ballot_col.css("background-color", party_colours[pref]);
    ballot_col.css("opacity", pref_opacity);
    ballot_col.css("width", col_width);
    ballot_col.css("height", ballot.n/SCALE - 1);
	if(pref === party_name) {
		ballot_stack.append(ballot_col);
	}
  }
  return ballot_stack;
}

