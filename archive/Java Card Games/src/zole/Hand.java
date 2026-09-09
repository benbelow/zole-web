package zole;

import java.util.ArrayList;
import java.util.Collections;

public class Hand {
	public int size = 0;
	public boolean flipped;
	ArrayList <Card> cards_in_hand = new ArrayList <Card>();
	
	public Hand(Deck deck,int size){
		while(this.size < size){
			cards_in_hand.add(deck.cards_in_deck.get(deck.cards_in_deck.size()-1));
			deck.cards_in_deck.remove(deck.cards_in_deck.size() -1);
			this.size += 1;
		}
		for (Card card: cards_in_hand){
			card.visible = true;
		}
	
	}
	public Hand(int size){
		
	}
	
	public void arrange(int dy){ //arranges cards to be drawn - dy is number of pixels above 3/4 down screen
		if(cards_in_hand.isEmpty()){
			return;
		}
		int cardwidth = cards_in_hand.get(0).width;
		int x = (AppFrame.width /2) - ((cardwidth*size + 5*size)/2) ;
		int y = (3*AppFrame.height)/4 - ((cardwidth/2) + dy);
		for(Card card: cards_in_hand){
			card.xpos = x;
			card.ypos = y;
			x += cardwidth + 5;
		}
	}
	public void sort(){
		Collections.sort(cards_in_hand, new HandsortComparator());
	}
	
	public void sort_points(boolean reverse){ //sorts by points in order depending on boolean reverse
		Collections.sort(cards_in_hand, new PointsComparator());
		if(reverse){
			Collections.reverse(cards_in_hand);
		}
	}
	
	public void flip(){
		for (Card card: cards_in_hand){
			card.flip();
		}
		flipped = !flipped;
	}
	
	public void flip(String state){
		for (Card card: cards_in_hand){
			card.flip(state);
		}
		if(state == "up"){
			flipped = false;
		} else if (state == "down"){
			flipped = true;
		}
	}
	
	public void remove(Card card){
		cards_in_hand.remove(card);
		card.visible = false;
		size -= 1;
	}
	
	public void add(Card card){
		cards_in_hand.add(card);
		card.visible = true;
		if(card.flipped != flipped){
			card.flip();
		}
		size += 1;
	}
	
	public void give(Hand hand, Card card){
		this.remove(card);
		hand.add(card);
	}
	public void give(Deck deck, Card card){
		this.remove(card);
		deck.add(card);
	}
	public boolean contains_suit(ZoleSuit suit){
		for(Card card: cards_in_hand){
			if(card.zolesuit == suit){
				return true;
			}
		}
		return false;
	}
	public boolean contains_value(Cardval value){
		for(Card card: cards_in_hand){
			if(card.value == value){
				return true;
			}
		}
		return false;
	}
	public int number_of_suit(ZoleSuit suit){
		int count = 0;
		for(Card card: cards_in_hand){
			if(card.zolesuit == suit){
				count += 1;
			}
		}
		return count;
	}
	public int number_of_single_aces(){
		int count = 0;
		for(Card card: cards_in_hand){
			if(card.value == Cardval.ACE){
				if(number_of_suit(card.zolesuit) == 1){
					count += 1;
				}
			}
		}
		return count;
	}
	public Card get_highest(ZoleSuit suit){
		sort_points(true);
		for(Card card : cards_in_hand){
			if(card.zolesuit == suit){
				return card;
			}
		}
		sort();
		return cards_in_hand.get(0); //defaults to first card in hand
	}
	
	public boolean has_points_trump(){ //true if hand contains ace or ten of diamonds
		boolean haspoints = false;
		for(Card card : cards_in_hand){
			if(card.zolesuit == ZoleSuit.TRUMPS && card.points > 9){
				haspoints = true;
			}
		}
		return haspoints;
	}
}
