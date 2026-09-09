package zole;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class RandomPlayPlayer extends Player implements PlayerInterface{

	public RandomPlayPlayer(int position, String name) {
		super(position, name);
		playertype = "AI";
	}
	
	public ArrayList<Card> toscore = new ArrayList<Card>();

	Random generator = new Random();
	
	private Card randomcard(){
		return hand.cards_in_hand.get(generator.nextInt(hand.size));
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

	

	public void play_round(){
		Card toplay = randomcard();
		if(roundposition != 0){
			ZoleSuit followsuit =  Game.trick.cards_in_hand.get(0).zolesuit;
			while(toplay.zolesuit != followsuit && hand.contains_suit(followsuit)){
				toplay = randomcard();
			}
		}
		play_card(toplay);
	}

}
