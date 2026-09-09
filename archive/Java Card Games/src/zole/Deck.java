package zole;

import java.util.ArrayList;
import java.util.Collections;

public class Deck {

	ArrayList<Card> cards_in_deck  = new ArrayList<Card>();
	public Deck(){
		for(Suit suit:Suit.values()){
			for(Cardval val:Cardval.values()){
				Card card = new Card(suit,val);
				CardPainter cardpainter = new CardPainter(card);
				AppFrame.cardpaintermap.put(card, cardpainter);
				//AppFrame.cardlist.add(card);
				cards_in_deck.add(card);
			}
		}
	}
	public void shuffle(){
		Collections.shuffle(cards_in_deck);
	}
	public void remove(Card card){
		cards_in_deck.remove(card);
	}
	public void add(Card card){
		cards_in_deck.add(card);
	}
}
