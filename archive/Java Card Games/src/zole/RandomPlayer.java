package zole;

import java.util.Random;

public class RandomPlayer extends Player implements PlayerInterface{

	public RandomPlayer(int position, String name) {
		super(position, name);
		playertype = "AI";
	}
	
	Random generator = new Random();
	
	private Card randomcard(){
		return hand.cards_in_hand.get(generator.nextInt(hand.size));
	}
	
	public void choose(){
		if (generator.nextBoolean()){
			pickup();
		} else {
			decline_pickup();
		}
	}
	public void putdown(){
		if(hand.size >8){
			score(randomcard(),hand,true); //scores randomly from hand
		} else if(hand.size == 8){
			putdown_complete();
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
