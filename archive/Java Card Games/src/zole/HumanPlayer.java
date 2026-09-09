package zole;

import java.awt.event.KeyEvent;

public class HumanPlayer extends Player implements PlayerInterface{

	public HumanPlayer(int position, String name) {
		super(position, name);
		playertype = "Human";
	}

	public void choose() {
		/*if (hand.cards_in_hand.contains(Game.cardclicked)) {
			decline_pickup();
			Game.cardclicked = null;
		}
		if (Game.table.cards_in_hand.contains(Game.cardclicked)) {
			pickup();
			Game.cardclicked = null;
		}*/
		
		//System.out.println("keypressed" + Game.keycodepressed);
		if (Game.keycodepressed == KeyEvent.VK_Y){
			pickup();
		} else if(Game.keycodepressed == KeyEvent.VK_N){
			decline_pickup();
		} else if(Game.keycodepressed == KeyEvent.VK_Z){
			call_zole();
		}
		return;

	}

	public void putdown() {
		if (Game.cardclicked == null) {
			return;
		}
		if (hand.size > 8 && hand.cards_in_hand.contains(Game.cardclicked)) { // scores clicked card if > 8 cards
			score(Game.cardclicked, hand, true);
		}
		if (hand.size ==8) {
			putdown_complete();
		}

		return;
	}

	public void play_round(){
		if(hand.cards_in_hand.contains(Game.cardclicked)){
			if(roundposition != 0){                                               //checks that clicked card follows suit if able
				ZoleSuit followsuit = Game.trick.cards_in_hand.get(0).zolesuit;
				if(Game.cardclicked.zolesuit != followsuit){
					if(hand.contains_suit(followsuit)){
						return;
					}
				}
			}
			play_card(Game.cardclicked);
		}
	}
	
}
