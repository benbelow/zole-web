package zole;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class Trick extends Hand{

	public Trick(int size) {
		super(size);
	}

	public Player checkwon(){
		ZoleSuit followsuit = cards_in_hand.get(0).zolesuit;
		Map <Card,Player> trickmap = new HashMap<Card,Player>();
		Player player1 = null;
		Player player2 = null;
		Player player3 = null;
		for (Player player: AppFrame.playerlist){
			switch(player.roundposition){
			case 0: player1 = player; break;
			case 1: player2 = player; break;
			case 2: player3 = player; break;
			}
		}
		trickmap.put(cards_in_hand.get(0), player1);
		trickmap.put(cards_in_hand.get(1), player2);
		trickmap.put(cards_in_hand.get(2), player3);
		//System.out.println(trickmap);
		this.sort();
		Collections.reverse(cards_in_hand);
		for (Card card: cards_in_hand){
			//System.out.println(card);
			if(card.zolesuit == followsuit || card.zolesuit == ZoleSuit.TRUMPS){
				return trickmap.get(card);
			}
		}
		return null;
	}
	
	public Card winningcard(){
		ZoleSuit followsuit = cards_in_hand.get(0).zolesuit;
		this.sort();
		Collections.reverse(cards_in_hand);
		for(Card card : cards_in_hand){
			if(card.zolesuit == followsuit || card.zolesuit == ZoleSuit.TRUMPS){
				return card;
			}
		}
		return null;
	}
	
	public int trickpoints(){
		int points = 0;
		for(Card card: cards_in_hand){
			points += card.points;
		}
		return points;
	}
}
