package zole;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AIPlayer extends Player implements PlayerInterface {

	public ArrayList<Card> toscore = new ArrayList<Card>();

	public AIPlayer(int position, String name) {
		super(position, name);
		playertype = "AI";
	}

	@Override
	public void choose() {
		int trumpnumber = hand.number_of_suit(ZoleSuit.TRUMPS);
		int singleaces = hand.number_of_single_aces();
		if ((trumpnumber + singleaces) == 8) {
			call_zole();
			return;
		} else if (trumpnumber >= 6) {
			pickup();
			return;
		} else { // assign value to trumps Q3, J2, 10A1, pickup if >= 12
			int valuecounter = 0;
			for (Card card : hand.cards_in_hand) {
				switch (card.value) {
				case QUEEN:
					valuecounter += 3;
					break;
				case JACK:
					valuecounter += 2;
					break;
				case ACE:
					if (card.zolesuit == ZoleSuit.TRUMPS) {
						valuecounter += 1;
					}
					break;
				case TEN:
					if (card.zolesuit == ZoleSuit.TRUMPS) {
						valuecounter += 1;
					}
					break;
				default:
					break;
				}
			}
			if (trumpnumber == 4) {
				if (hand.number_of_single_aces() > 1 && valuecounter > 8) {
					pickup();
				} else {
					decline_pickup();
				}
			} else if (trumpnumber == 5) {
				if (valuecounter > 9
						|| (hand.number_of_single_aces() >= 1 && valuecounter >= 9)) {
					pickup();
				} else {
					decline_pickup();
				}
			} else {
				decline_pickup();
			}
		}
	}

	@Override
	public void putdown() {
		int trumpnumber = hand.number_of_suit(ZoleSuit.TRUMPS);
		int spadenumber = hand.number_of_suit(ZoleSuit.SPADES);
		int heartnumber = hand.number_of_suit(ZoleSuit.HEARTS);
		int clubnumber = hand.number_of_suit(ZoleSuit.CLUBS);
		for (Card card : hand.cards_in_hand) {
			if (card.value == Cardval.ACE
					&& hand.number_of_suit(card.zolesuit) == 1) { // single aces
																	// don't
																	// count
				switch (card.zolesuit) {
				case SPADES:
					spadenumber = 0;
					break;
				case HEARTS:
					heartnumber = 0;
					break;
				case CLUBS:
					clubnumber = 0;
					break;
				case TRUMPS:
					break;
				}
			}
		}

		while (putdown < 2) {
			if (trumpnumber >= 8) {
				//System.out.println("1: Lots of trumps");
				if (putdown < 2) {
					toscore.add(hand.cards_in_hand.get(0));
					putdown += 1;
					scoretoscore();
				}

			} else { // <8 trumps
				if (putdown < 2) {
					if (spadenumber == 1 && clubnumber == 1 || spadenumber == 1
							&& heartnumber == 1 || heartnumber == 1
							&& clubnumber == 1) {
						//System.out.println("2: elim two suits");
						if (spadenumber == clubnumber
								&& clubnumber == heartnumber) { // i.e.
																// (1,1,1)
							hand.sort_points(true);
							for (Card card : hand.cards_in_hand) {
								if (card.zolesuit != ZoleSuit.TRUMPS
										&& hand.number_of_suit(card.zolesuit) == 1
										&& putdown < 2) {
									toscore.add(card);
									putdown += 1;
								}
							}
							scoretoscore();
						} else { // eliminate only two suits possible
							for (Card card : hand.cards_in_hand) {
								if (hand.number_of_suit(card.zolesuit) == 1
										&& putdown < 2) {
									toscore.add(card);
									putdown += 1;
								}
							}
							scoretoscore();
						}
					} else if (spadenumber == 2 || heartnumber == 2
							|| clubnumber == 2) { // eliminates suit with two
													// cards
						if ((spadenumber == 1 || heartnumber == 1 || clubnumber == 1)
								|| (spadenumber == 2 && clubnumber == 2
										|| spadenumber == 2 && heartnumber == 2 || heartnumber == 2
										&& clubnumber == 2)) {
							//System.out.println("3: Eliminates one of two suits");
							int twospadepoints = 0; // points of two of a suit
							ArrayList<Card> twospadelist = new ArrayList<Card>();
							int twoheartpoints = 0;
							ArrayList<Card> twoheartlist = new ArrayList<Card>();
							int twoclubpoints = 0;
							ArrayList<Card> twoclublist = new ArrayList<Card>();
							int spadepluspoints = 0; // points of one of a suit
														// +
														// highest of another
														// suit
														// (2/3/4 trumps)
							ArrayList<Card> onespadelist = new ArrayList<Card>();
							int heartpluspoints = 0;
							ArrayList<Card> oneheartlist = new ArrayList<Card>();
							int clubpluspoints = 0;
							ArrayList<Card> oneclublist = new ArrayList<Card>();

							Card highheart = hand.get_highest(ZoleSuit.HEARTS);
							Card highspade = hand.get_highest(ZoleSuit.SPADES);
							Card highclub = hand.get_highest(ZoleSuit.CLUBS);

							for (Card card : hand.cards_in_hand) { // works out
																	// six
																	// points
																	// possibilities
																	// above

								if (card.zolesuit == ZoleSuit.SPADES
										&& spadenumber == 2) {
									twospadepoints += card.points;
									twospadelist.add(card);

								} else if (card.zolesuit == ZoleSuit.HEARTS
										&& heartnumber == 2) {
									twoheartpoints += card.points;
									twoheartlist.add(card);

								} else if (card.zolesuit == ZoleSuit.CLUBS
										&& clubnumber == 2) {
									twoclubpoints += card.points;
									twoclublist.add(card);

								} else if (card.zolesuit == ZoleSuit.SPADES
										&& spadenumber == 1) {
									spadepluspoints += card.points;
									onespadelist.add(card);
									if (clubnumber == 0
											|| (heartnumber != 0 && (highheart.points >= highclub.points))) {
										spadepluspoints += highheart.points;
										onespadelist.add(highheart);
									} else if (heartnumber == 0
											|| (clubnumber != 0 && (highheart.points <= highclub.points))) {
										spadepluspoints += highclub.points;
										onespadelist.add(highclub);
									}

								} else if (card.zolesuit == ZoleSuit.HEARTS
										&& heartnumber == 1) {
									heartpluspoints += card.points;
									oneheartlist.add(card);
									if (clubnumber == 0
											|| (spadenumber != 0 && (highspade.points >= highclub.points))) {
										heartpluspoints += highspade.points;
										oneheartlist.add(highspade);
									} else if (spadenumber == 0
											|| (clubnumber != 0 && (highspade.points <= highclub.points))) {
										heartpluspoints += highclub.points;
										oneheartlist.add(highclub);
									}

								} else if (card.zolesuit == ZoleSuit.CLUBS
										&& clubnumber == 1) {
									clubpluspoints += card.points;
									oneclublist.add(card);
									if (spadenumber == 0
											|| (heartnumber != 0 && (highheart.points >= highspade.points))) {
										clubpluspoints += highheart.points;
										oneclublist.add(highheart);
									} else if (heartnumber == 0
											|| (spadenumber != 0 && (highheart.points <= highspade.points))) {
										clubpluspoints += highspade.points;
										oneclublist.add(highspade);
									}
								}
							}

							List<Integer> checklist = Arrays.asList(
									twospadepoints, twoheartpoints,
									twoclubpoints, spadepluspoints,
									heartpluspoints, clubpluspoints);
							//System.out.println(checklist);
							Collections.sort(checklist);
							Collections.reverse(checklist);
							Map<Integer, ArrayList<Card>> checkmap = new HashMap<Integer, ArrayList<Card>>();
							checkmap.put(twospadepoints, twospadelist);
							checkmap.put(twoheartpoints, twoheartlist);
							checkmap.put(twoclubpoints, twoclublist);
							checkmap.put(spadepluspoints, onespadelist);
							checkmap.put(heartpluspoints, oneheartlist);
							checkmap.put(clubpluspoints, oneclublist);
							
							ArrayList<Card> toscoreinner;
							int checklistnum = 0;
							do{
								toscoreinner = checkmap.get(checklist.get(checklistnum));
								checklistnum += 1;
							} while(toscoreinner.size() != 2);
								
							//System.out.println(checklist);
							//System.out.println(toscoreinner);
							for (Card card : toscoreinner) {
								//System.out.println(card.value);
								toscore.add(card);
								putdown += 1;
							}
							scoretoscore();

						} else { // eliminate suit with 2 cards if only suit
									// that
									// can be eliminated
							//System.out.println("4: Eliminate only suit possible with 2");
							for (Card card : hand.cards_in_hand) {
								if (hand.number_of_suit(card.zolesuit) == 2
										&& putdown < 2) {
									toscore.add(card);
									putdown += 1;
								}
							}
							scoretoscore();
						}
					} else if (spadenumber == 1 || clubnumber == 1
							|| heartnumber == 1) {
						//System.out.println("5: Eliminate one suit + score highly");
						for (Card card : hand.cards_in_hand) {
							if (hand.number_of_suit(card.zolesuit) == 1
									&& putdown < 2) {
								toscore.add(card);
								putdown += 1;
							}
						}
						scoretoscore();
						if (putdown < 2) {
							hand.sort_points(true);
							for (Card card : hand.cards_in_hand) {
								if (card.zolesuit != ZoleSuit.TRUMPS
										&& putdown < 2) {
									toscore.add(card);
									putdown += 1;
								}
							}
							scoretoscore();
						}
					} else { // score most points
						//System.out.println("6: score most points");
						hand.sort_points(true);
						for (Card card : hand.cards_in_hand) {
							if (card.zolesuit != ZoleSuit.TRUMPS && putdown < 2) {
								toscore.add(card);
								putdown += 1;
							}
						}
						scoretoscore();
					}

				}
			}
		}

		// System.out.println(putdown);
		hand.sort();

		if (putdown == 2) {
			//System.out.println("putdown complete");
			putdown_complete();
		}

	}

	public void scoretoscore() { // to avoid concurrentmodificationexception.
									// used when putting down
		while (!toscore.isEmpty()) {
			//System.out.println("Scoring " + toscore.get(0).value + " of " + toscore.get(0).suit);
			score(toscore.get(0), hand, true);
			toscore.remove(0);
		}
	}

	@Override
	public void play_round() {
		ZoleSuit followsuit;
		if (!Game.trick.cards_in_hand.isEmpty()) {
			followsuit = Game.trick.cards_in_hand.get(0).zolesuit;
		} else {
			followsuit = null;
		}
		//TEST AREA//
		
		//TEST AREA//
		
		if (roundposition == 0 && status == "big") { // BIG ONE, FIRST
			bigfirst();
		} else if (roundposition == 1 && status == "big") { // BIG ONE, SECOND
			bigsecond(followsuit);
		} else if (roundposition == 2 && status == "big") { // BIG ONE, THIRD
			bigthird(followsuit);
		} else if (roundposition == 0 && status == "small") { // SMALL ONE, FIRST
			smallfirst();
		} else if (roundposition == 1 && status == "small") { // SMALL ONE, SECOND
			smallsecond(followsuit);
		} else if (roundposition == 2 && status == "small") { // SMALL ONE, THIRD
			smallthird(followsuit);
		}	
	}

//separates play_round function into six for ease of reading
	
private void bigfirst(){
	//System.out.println("BIG FIRST");
	if (hand.number_of_single_aces() > 0) { // plays single ace
		for (Card card : hand.cards_in_hand) {
			if (card.value == Cardval.ACE
					&& hand.number_of_suit(card.zolesuit) == 1
					&& number_scored(card.zolesuit) == 0) {
				play_card(card);
				return;
			}
		}
	}
	if (points_trumps_gone_or_in_hand()) { // small ones don't have ace
											// or ten
		for (Card card : hand.cards_in_hand) {
			if (card.value == Cardval.JACK
					|| card.value == Cardval.QUEEN) { // play lowest J/Q
				play_card(card);
				return;
			}
		}
		for (Card card : hand.cards_in_hand) {
			if (card.zolesuit == ZoleSuit.TRUMPS) { // play trump if no
													// J/Q
				play_card(card);
				return;
			}
		}
	}
	for (Player player : AppFrame.playerlist) { // play high if someone
												// out of trumps
		if (player != this && player.outoftrumps) {
			play_highest();
			return;
		}
	}
	if (hand.contains_value(Cardval.JACK)) { // play high jack
		play_highest(Cardval.JACK);
		return;
	}
	if (hand.contains_value(Cardval.QUEEN)) { // play low queen
		play_lowest(Cardval.QUEEN);
		return;
	}
	play_highest();
	return;
}

private void bigsecond(ZoleSuit followsuit){
	//System.out.println("BIG SECOND");
	if (followsuit != ZoleSuit.TRUMPS) { // non trumps led
		if (hand.number_of_suit(followsuit) != 0) { // can follow suit
			if (hand.number_of_suit(followsuit) == 1) { // only one
														// option
				play_highest(followsuit); // play only card following
											// suit
				return;
			} else {
				play_lowest(followsuit); // play lowest of suit, thus
											// lowest points
				return;
			}
		} else { // can't follow non-trump
			if (number_scored(followsuit) != 0
					|| (number_scored(followsuit) == 0 && Game.trick.cards_in_hand
							.get(0).value == Cardval.ACE)) { // suit
																// already
																// played
																// or
																// ace
																// led
				if (hand.contains_value(Cardval.JACK)) { // play J
					play_lowest(Cardval.JACK);
					return;
				}
				if (hand.contains_value(Cardval.QUEEN)) { // play Q
					play_lowest(Cardval.QUEEN);
					return;
				}
				Collections.reverse(hand.cards_in_hand);
				for (Card card : hand.cards_in_hand) { // play
														// non-points
														// trump
					if (card.points < 10
							&& card.zolesuit == ZoleSuit.TRUMPS) {
						play_card(card);
						hand.sort();
						return;
					}
				}
				hand.sort();
				for (Card card : hand.cards_in_hand) { // plays low
														// points,
														// removing suit
														// (not sure if
														// ideal)
					if (card.points < 10
							&& hand.number_of_suit(card.zolesuit) == 1) {
						play_card(card);
						return;
					}
				}
				play_low_points();
				return;
			} else { // new suit, non ace
				for (Card card : hand.cards_in_hand) { // play points
														// trump
					if (card.points > 3
							&& card.zolesuit == ZoleSuit.TRUMPS) {
						play_card(card);
						return;
					}
				}
				if (hand.contains_suit(ZoleSuit.TRUMPS)) { // play low
															// trump if
															// possible
					play_lowest(ZoleSuit.TRUMPS);
					return;
				}
				play_low_points(); // cannot win, play low points
				return;

			}
		}
	} else { // trumps led
		boolean canwin = false;
		for (Card card : hand.cards_in_hand) { // wins without playing
												// points
			if (card.zolesuit == ZoleSuit.TRUMPS
					&& card.beats(Game.trick.cards_in_hand.get(0))) {
				canwin = true;
				if (card.points < 9) {
					play_card(card);
					return;
				}
			}
		}
		if (canwin) {
			play_highest(ZoleSuit.TRUMPS); // wins with 10/A if has to
			return;
		}
		if (hand.contains_suit(ZoleSuit.TRUMPS)) { // possibly non ideal
													// - this will throw
													// non-winning J/Q
													// before K
			play_low_points(ZoleSuit.TRUMPS);
			return;
		}
		outoftrumps = true;
		play_low_points();
		return;
	}
}

private void bigthird(ZoleSuit followsuit){
	//System.out.println("BIG THIRD");
	if (followsuit != ZoleSuit.TRUMPS
			&& hand.number_of_suit(followsuit) != 0) { // non trumps,
														// can follow
		if (can_win()) {
			play_highest(followsuit);
			return;
		}
		hand.sort();
		play_lowest(followsuit); // plays lowest card in suit to follow
		return;
	} else if (followsuit != ZoleSuit.TRUMPS
			&& hand.number_of_suit(followsuit) == 0) { // non trumps,
														// cannot follow
		hand.sort_points(true);
		for (Card card : hand.cards_in_hand) { // wins with points if
												// possible
			if (card.points > 3
					&& card.beats(Game.trick.cards_in_hand.get(0),
							Game.trick.cards_in_hand.get(1))) {
				play_card(card);
				hand.sort();
				return;
			}
		}
		hand.sort(); // wins if lots of points in trick
		if (Game.trick.trickpoints() > 9 && can_win()) {
			play_lowest_winning();
			return;
		}
		if (hand.has_points_trump()) { // plays lowest non-points trump
			for (Card card : hand.cards_in_hand) {
				if (card.zolesuit == ZoleSuit.TRUMPS
						&& card.points < 10) {
					play_card(card);
					return;
				}
			}
		}
		if (hand.contains_suit(ZoleSuit.TRUMPS)) { // plays lowest trump
			play_lowest(ZoleSuit.TRUMPS);
			return;
		}
		play_low_points();
		return;
	} else if (followsuit == ZoleSuit.TRUMPS) { // trumps lead
		if (can_win()) {
			for (Card card : hand.cards_in_hand) {
				if (card.points > 3
						&& card.beats(Game.trick.cards_in_hand.get(0),
								Game.trick.cards_in_hand.get(1))) {
					play_card(card);
					return;
				}
			}
			play_lowest_winning();
			return;
		}
		if (hand.contains_suit(ZoleSuit.TRUMPS)) {
			play_low_points(ZoleSuit.TRUMPS);
			return;
		} else {
			outoftrumps = true;
			play_low_points();
			return;
		}
	}
	failsafe(followsuit);
}

private void smallfirst(){
	//System.out.println("SMALL FIRST");
	for (Player player : AppFrame.playerlist) {
		if (player.roundposition == 1 && player.status == "small") { // playing
																		// through
																		// partner
			int minsuit = Math.min(
					hand.number_of_suit(ZoleSuit.HEARTS),
					Math.min(hand.number_of_suit(ZoleSuit.CLUBS),
							hand.number_of_suit(ZoleSuit.SPADES)));
			for (Card card : hand.cards_in_hand) {
				if (hand.number_of_suit(card.zolesuit) == minsuit
						&& card.zolesuit != ZoleSuit.TRUMPS) {
					play_card(card);
					return;
				}
			}
		} else if (player.roundposition == 1 && player.status == "big") { // playing
																			// through
																			// big
																			// one
			if (hand.number_of_single_aces() > 0) {
				for (Card card : hand.cards_in_hand) { // play single
														// ace if
														// possible
					if (card.value == Cardval.ACE
							&& hand.number_of_suit(card.zolesuit) == 1
							&& card.zolesuit != ZoleSuit.TRUMPS
							&& number_scored(card.zolesuit) == 0) {
						play_card(card);
						return;
					}
				}
			}
			Collections.reverse(hand.cards_in_hand);
			for (Card card : hand.cards_in_hand) { // plays biggest
													// points of non
													// trumps of which
													// there are 3 or 4
													// in hand/already
													// played (possibly
													// make this just 4)
				if (card.zolesuit != ZoleSuit.TRUMPS
						&& (hand.number_of_suit(card.zolesuit) + number_scored(card.zolesuit)) > 2) {
					play_card(card);
					hand.sort();
					return;
				}
			}
			hand.sort();
			int maxsuit = Math.max(
					hand.number_of_suit(ZoleSuit.HEARTS),
					Math.max(hand.number_of_suit(ZoleSuit.CLUBS),
							hand.number_of_suit(ZoleSuit.SPADES)));
			for (Card card : hand.cards_in_hand) {
				if (hand.number_of_suit(card.zolesuit) == maxsuit
						&& card.zolesuit != ZoleSuit.TRUMPS) {
					play_card(card);
					return;
				}
			}
		}
	}
	failsafe(null);
}

private void smallsecond(ZoleSuit followsuit){

	//System.out.println("SMALL SECOND");
	for (Player player : AppFrame.playerlist) {
		if (player.roundposition == 2 && player.status == "big") { // playing into big one
																	
			if (followsuit != ZoleSuit.TRUMPS && hand.contains_suit(followsuit)) { // non trump, can follow
				//System.out.println("non trump, can follow, into big");										
				if ((number_scored(followsuit) + hand.number_of_suit(followsuit) == 1) && Game.trick.cards_in_hand.get(0).value == Cardval.ACE) { // play points on ace
																					
					play_highest(followsuit);
					return;
				}
			}
			if (followsuit != ZoleSuit.TRUMPS && !hand.contains_suit(followsuit)) { // non trumps, cannot follow
				//System.out.println("non trump, cannot follow, into big");								
				if (number_scored(followsuit) == 0
						&& Game.trick.cards_in_hand.get(0).value == Cardval.ACE) {
					if (hand.contains_suit(ZoleSuit.TRUMPS)) {
						play_high_points(ZoleSuit.TRUMPS);
						return;
					}
				}
				if (Game.trick.trickpoints() > 9) {
					if (hand.contains_suit(ZoleSuit.TRUMPS)) {
						play_highest(ZoleSuit.TRUMPS);
						return;
					}
				}
				for (Card card : hand.cards_in_hand) {
					if (card.zolesuit == ZoleSuit.TRUMPS
							&& card.points < 10) {
						play_card(card);
						return;
					}
				}
				play_low_points();
				return;
			}
			if (followsuit == ZoleSuit.TRUMPS) { // trumps led
				//System.out.println("trump led, into big");
				if (hand.contains_suit(ZoleSuit.TRUMPS)) {
					play_low_points(ZoleSuit.TRUMPS);
					return;
				}
				play_low_points();
				return;
			}
		} else if (player.roundposition == 2 && player.status == "small") { // playing into small one/partner
												
			if (followsuit != ZoleSuit.TRUMPS && hand.number_of_suit(followsuit) != 0) { // non trumps, can follow
				//System.out.println("non trumps, can follow, into small");											
				if (can_win()) {
					play_lowest_winning();
					return;
				}
				play_lowest(followsuit);
				return;
			} else if (followsuit != ZoleSuit.TRUMPS && hand.number_of_suit(followsuit) == 0) { // non trumps, cannot follow
				//System.out.println("non trumps, can't follow, into small");												
				if (hand.number_of_suit(ZoleSuit.TRUMPS) != 0) {
					if (hand.has_points_trump()) {
						play_high_points(ZoleSuit.TRUMPS);
						return;
					}
					play_lowest(ZoleSuit.TRUMPS);
					return;
				}
			} else if (followsuit == ZoleSuit.TRUMPS && hand.number_of_suit(ZoleSuit.TRUMPS) != 0) { // trumps, can follow
				//System.out.println("trumps, can follow, into small");													
				int pointstrumpsgone = 0; // how many of A/10 trumps scored					
				for (Card card : AppFrame.cardlist) {
					if (card.zolesuit == ZoleSuit.TRUMPS && (card.value == Cardval.ACE || card.value == Cardval.TEN)) {
						if (check_if_scored(card) || hand.cards_in_hand.contains(card)) {
							pointstrumpsgone += 1;
						}
					}
				}
				//System.out.println("small second, into small, can follow trumps" + pointstrumpsgone);
				for (Player p : AppFrame.playerlist) {
					if (p != this && p.status == "small") {
						if (p.outoftrumps) { // will win if partner out of trumps
												
							if (can_win()) {
								play_lowest_winning();
								return;
							}
						}
						if (hand.has_points_trump()) {
							if (Game.trick.cards_in_hand.get(0) != maxtrumpnotinhand()) { // if partner not out of trumps, play points if max trump not led
								play_high_points(ZoleSuit.TRUMPS);
								return;
							}
						}
					}
					
					
				}
				if (pointstrumpsgone < 2) { // will win if partner may have points
											
					if (can_win()) {
						play_lowest_winning();
						return;
					}
				}
				play_low_points(ZoleSuit.TRUMPS);
				return;
			} else if (followsuit == ZoleSuit.TRUMPS && hand.number_of_suit(ZoleSuit.TRUMPS) == 0) { // trumps lead, cannot follow
				//System.out.println("trumps, cannot follow, into small");												
				for (Player p : AppFrame.playerlist) {
					if (p != this && p.status == "small") {
						if (!p.outoftrumps) { // plays points in hope partner can win
							if (Game.trick.cards_in_hand.get(0) != maxtrumpnotinhand()) {
								play_high_points();
								return;
							}
						}
					}
				}
				play_low_points();
				return;
			}
		}
	}
	failsafe(followsuit);
}

private void smallthird(ZoleSuit followsuit){

	//System.out.println("SMALL THIRD");
	if (followsuit != ZoleSuit.TRUMPS
			&& hand.number_of_suit(followsuit) != 0) { // non trumps, can follow
		for (Player player : AppFrame.playerlist) {
			if (player != this && player.status == "small") {
				if (player.winning_trick()) { // if partner winning
					play_high_points(followsuit);
					return;
				}
				if (can_win()) {
					play_lowest_winning();
					return;
				}
				play_low_points(followsuit);
				return;
			}
		}
	} else if (followsuit != ZoleSuit.TRUMPS
			&& hand.number_of_suit(followsuit) == 0) { // non trumps, cannot follow
		for (Player player : AppFrame.playerlist) {
			if (player != this && player.status == "small") {
				if (player.winning_trick()) {
					hand.sort_points(true);
					if (hand.cards_in_hand.size() > 1
							&& hand.cards_in_hand.get(0).points == hand.cards_in_hand
									.get(1).points) {
						ArrayList<Card> tochoose = new ArrayList<Card>();
						ArrayList<Integer> numbers = new ArrayList<Integer>();
						for (Card card : hand.cards_in_hand) {
							if (card.points == hand.cards_in_hand
									.get(0).points
									&& !(card.points == 11 && hand
											.number_of_suit(card.zolesuit) == 1)) {
								tochoose.add(card);
								numbers.add(hand
										.number_of_suit(card.zolesuit));
							}
						}
						if (tochoose.size() != 0) {
							Map<Integer, Card> sizemap = new HashMap<Integer, Card>();
							for (Card card : tochoose) {
								sizemap.put(hand
										.number_of_suit(card.zolesuit),
										card);
							}
							Collections.sort(numbers);
							play_card(sizemap.get(numbers.get(0)));
							hand.sort();
							return;
						}
						play_high_points();
						hand.sort();
						return;
					}
				} else { // partner not winning
					if (hand.has_points_trump()) {
						for (Card card : hand.cards_in_hand) {
							if (card.zolesuit == ZoleSuit.TRUMPS
									&& (card.value == Cardval.ACE || card.value == Cardval.TEN)) {
								if (card.beats(
										Game.trick.cards_in_hand.get(0),
										Game.trick.cards_in_hand.get(1))) {
									play_card(card);
									return;
								}
							}
						}
						if (Game.trick.trickpoints() > 9) {
							if (can_win()) {
								play_lowest_winning();
								return;
							}
						}
						play_low_points();
						return;
					}
				}
			}
		}
	} else if (followsuit == ZoleSuit.TRUMPS && hand.number_of_suit(followsuit) != 0) { // trumps, can follow
		for (Card card : hand.cards_in_hand) { // wins with points trumps if possible
			if (card.zolesuit == ZoleSuit.TRUMPS
					&& (card.value == Cardval.ACE || card.value == Cardval.TEN)) {
				if (card.beats(Game.trick.cards_in_hand.get(0),
						Game.trick.cards_in_hand.get(1))) {
					play_card(card);
					return;
				}
			}
		}
		for (Player player : AppFrame.playerlist) {
			if (player != this && player.status == "small") {
				if (player.winning_trick()) { //partner winning
					hand.sort_points(true);
					for (Card card : hand.cards_in_hand) {
						if (card.points > 3
								&& card.zolesuit == ZoleSuit.TRUMPS) {
							play_card(card);
							hand.sort();
							return;
						}
					}
					play_lowest(ZoleSuit.TRUMPS);
					hand.sort();
					return;
				} else { // partner not winning
					if (Game.trick.trickpoints() > 9) {
						if (can_win()) {
							play_lowest_winning();
							return;
						}
					}
				}
			}

		}

	} else if (followsuit == ZoleSuit.TRUMPS
			&& hand.number_of_suit(followsuit) == 0) { // trumps, can't
														// follow
		for (Player player : AppFrame.playerlist) {
			if (player != this && player.status == "small") {
				if (player.winning_trick()) {
					hand.sort_points(true);
					if (hand.cards_in_hand.size() > 1
							&& hand.cards_in_hand.get(0).points == hand.cards_in_hand
									.get(1).points) {
						ArrayList<Card> tochoose = new ArrayList<Card>();
						ArrayList<Integer> numbers = new ArrayList<Integer>();
						for (Card card : hand.cards_in_hand) {
							if (card.points == hand.cards_in_hand
									.get(0).points
									&& !(card.points == 11 && hand
											.number_of_suit(card.zolesuit) == 1)) {
								tochoose.add(card);
								numbers.add(hand
										.number_of_suit(card.zolesuit));
							}
						}
						if (tochoose.size() != 0) {
							Map<Integer, Card> sizemap = new HashMap<Integer, Card>();
							for (Card card : tochoose) {
								sizemap.put(hand
										.number_of_suit(card.zolesuit),
										card);
							}
							Collections.sort(numbers);
							play_card(sizemap.get(numbers.get(0)));
							hand.sort();
							return;
						}
						play_high_points();
						hand.sort();
						return;
					}
					hand.sort();
				} else { // partner not winning
					play_low_points();
					return;
				}
			}
		}
	
}
	failsafe(followsuit);
}

private void failsafe(ZoleSuit followsuit){
		//System.out.println("...FAILSAFE...");
		if (hand.contains_suit(followsuit)) {
			play_lowest(followsuit);
			return;
		}
		play_lowest();
		return;
}
}