package zole;

import java.util.Iterator;

public class ZoleDeck extends Deck {

	public ZoleDeck() {
		super(); // makes 52 card deck
		Iterator<Card> i = this.cards_in_deck.iterator();
		while (i.hasNext()) {
			Card c = i.next();
			switch (c.value) {
			case TWO:
				i.remove();
				AppFrame.cardlist.remove(c);
				break;
			case THREE:
				i.remove();
				AppFrame.cardlist.remove(c);
				break;
			case FOUR:
				i.remove();
				AppFrame.cardlist.remove(c);
				break;
			case FIVE:
				i.remove();
				AppFrame.cardlist.remove(c);
				break;
			case SIX:
				i.remove();
				AppFrame.cardlist.remove(c);
				break;
			case SEVEN:
				if (c.suit != Suit.DIAMONDS) {
					i.remove();
					AppFrame.cardlist.remove(c);
					break;
				}
			case EIGHT:
				if (c.suit != Suit.DIAMONDS) {
					i.remove();
					AppFrame.cardlist.remove(c);
					break;
				}
			default:
				break;
			}

		}

	}

	public void deal(){
		for(Player player:AppFrame.playerlist){
			player.hand = new Hand(this,8);
			switch(player.playertype){
			case "AI": player.hand.flip("up"); break;
			case "Human": player.hand.flip("up"); break;
			}
			
		}
		Game.table = new Hand(this,2);
		Game.table.flip("up");
	}
	
}
