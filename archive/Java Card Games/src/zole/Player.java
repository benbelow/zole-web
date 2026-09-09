package zole;

import java.util.ArrayList;
import java.util.Collections;



public abstract class Player implements PlayerInterface{
	public String playertype;
	public Hand hand;
	public String name;
	public int tableposition;
	public int roundposition;
	public String status; //big or small in each round
	public int roundpoints;
	public int gamepoints;
	public boolean outoftrumps;
	public boolean zole;
	public ArrayList<Card> cards_scored = new ArrayList<Card>(); //cards privately scored by this player - i.e. if big one, or small one in zole round
	
	
	public int putdown = 0; //how many cards put down this round //only matters to AI
	
	

	public Player(int position, String name) {
		this.name = name;
		tableposition = position;
		roundposition = position;
		AppFrame.playerlist.add(this);
	}

	public void score(Card card, Hand hand, boolean hidden) { // scores card from hand - adds
												// card to scored list, adds
												// points to score
		boolean iszole = false; //true if zole round
		for (Player player : AppFrame.playerlist){
			if(player.zole){
				iszole = true;
			}
		}
		hand.remove(card);
		roundpoints += card.points;
		if(hidden){  //privately scored i.e. put down
			if(iszole){
				Game.zole_cards_scored.add(card);
			} else{
				cards_scored.add(card);
			}
			
		} else{     // publicly scored i.e. won a trick
			Game.cards_scored.add(card);
		}
	}
	
	
	
	public void focus() { // rotates positions until this player going first
		while (roundposition != 0) {
			Game.rotate();
		}
	}

	public void pickup() {
		while (!Game.table.cards_in_hand.isEmpty()) {
			Game.table.give(this.hand, Game.table.cards_in_hand.get(0));
		}
		status = "big";
		for (Player player : AppFrame.playerlist) {
			if (player != this) {
				player.status = "small";
			}
		}
		hand.sort();
		Game.stage = "putting down";
		System.out.println(name + " picked up!");
		return;
	}

	public void decline_pickup() {
		System.out.println(name + " declined.");
		for (Player player : AppFrame.playerlist) {
			if (player.roundposition ==  Game.currentplayer && player.roundposition == 2 ) {
				Game.stage = "no-one picked up";
			}
		}
		Game.currentplayer += 1;

	}

	public void call_zole(){
		zole = true;
		status = "big";
		for(Player player : AppFrame.playerlist){
			if(player != this){
				player.status = "small";
				if(!Game.table.cards_in_hand.isEmpty()){
					player.score(Game.table.cards_in_hand.get(0),Game.table, true);
				}
			}
		}
		System.out.println("Player " + name + " called zole!");
		putdown_complete();
	}
	
	public void play_card(Card card) {
		card.flip("up");
		hand.give(Game.trick, card);
		Game.currentplayer += 1;
	}

	public void play_lowest(){
		play_card(hand.cards_in_hand.get(0));
	}
	public void play_highest(){
		play_card(hand.cards_in_hand.get(hand.cards_in_hand.size()-1));
	}
	public void play_lowest(ZoleSuit suit){
		for(Card card: hand.cards_in_hand){
			if(card.zolesuit == suit){
				play_card(card);
				return;
			}
		}
		System.out.println("Tried to play lowest " + suit + ", but couldn't. Playing lowest...");
		play_lowest();
	}
	public void play_highest(ZoleSuit suit){
		Collections.reverse(hand.cards_in_hand);
		for(Card card: hand.cards_in_hand){
			if(card.zolesuit == suit){
				play_card(card);
				hand.sort();
				return;
			}
		}
		System.out.println("Tried to play highest " + suit + ", but couldn't. Playing highest...");
		hand.sort();
		play_highest();
	}
	public void play_lowest(Cardval value){ //only works for J/Q
		for(Card card:hand.cards_in_hand){
			if(card.value == value){
				play_card(card);
				return;
			}
		}
		System.out.println("Tried to play lowest " + value  + ", but couldn't. Playing lowest...");
		play_lowest();
	}
	public void play_highest(Cardval value){ //only for J/Q
		Collections.reverse(hand.cards_in_hand);
		for(Card card:hand.cards_in_hand){
			if(card.value == value){
				play_card(card);
				hand.sort();
				return;
			}
		}
		System.out.println("Tried to play highest " + value  + ", but couldn't. Playing highest...");
		hand.sort();
		play_highest();
	}
	public void play_low_points(){
		hand.sort_points(false);
		play_card(hand.cards_in_hand.get(0));
		hand.sort();
	}
	public void play_high_points(){
		hand.sort_points(true);
		play_card(hand.cards_in_hand.get(0));
		hand.sort();
	}
	public void play_low_points(ZoleSuit suit){
		hand.sort_points(false);
		for(Card card : hand.cards_in_hand){
			if(card.zolesuit == suit){
				play_card(card);
				hand.sort();
				return;
			}
		}
		System.out.println("Tried to play low " + suit + ", but couldn't. Playing low points.");
		play_low_points();
	}
	public void play_high_points(ZoleSuit suit){
		hand.sort_points(true);
		for(Card card : hand.cards_in_hand){
			if(card.zolesuit == suit){
				play_card(card);
				hand.sort();
				return;
			}
		}
		System.out.println("Tried to play high " + suit + ", but couldn't. Playing high points.");
		play_high_points();
	}
	public void play_lowest_winning(){
		if(!can_win()){
			System.out.println("Tried winning with lowest, couldn't win. Playing Low");
			play_lowest();
			return;
		}
		if(Game.trick.cards_in_hand.size() == 0){
			play_lowest();
			return;
		}
		if(Game.trick.cards_in_hand.size() == 1){
			for(Card card: hand.cards_in_hand){
				if(card.beats(Game.trick.cards_in_hand.get(0))){
					play_card(card);
					return;
				}
			}
		}
		if(Game.trick.cards_in_hand.size() == 2){
			for(Card card: hand.cards_in_hand){
				if(card.beats(Game.trick.cards_in_hand.get(0), Game.trick.cards_in_hand.get(1))){
					play_card(card);
					return;
				}
			}
		}
	}
	
	
	public void putdown_complete(){
		Game.currentplayer = 0;
		Game.stage = "playing";
	}
	
	//methods which benefit AI below
	
	public boolean check_if_scored(Card card){ //checks if card is visibly out of play
		if(Game.cards_scored.contains(card) || (cards_scored.contains(card))){
			return true;
		}
		else{
			return false;
		}
	}
	
	public int number_scored(ZoleSuit suit){ //returns number of a suit visibly scored 
		int suitnumber = 0;
		for(Card card : Game.cards_scored){
			if(card.zolesuit == suit){
				suitnumber += 1;
			}
		}
		if(!cards_scored.isEmpty()){
			for(Card card : cards_scored){
				if(card.zolesuit == suit){
					suitnumber += 1;
				}
			}
		}
		return suitnumber;
	}
	
	public boolean winning_trick(){ //checks if player winning trick of 2 cards
		if(Game.trick.cards_in_hand.size() != 2){
			return (Boolean) null;
		}
		boolean winning; //boolean of whether first card is winning
		if(Game.trick.cards_in_hand.get(1).beats(Game.trick.cards_in_hand.get(0))){
			winning = true; //true if second card winning
		} else{
			winning = false;
		}
		switch(roundposition){
		case 0: return !winning;
		case 1: return winning;
		default: return (Boolean) null;
		}
	}
	
	public Card maxtrumpnotinhand(){ //returns highest trump in play that isn't in hand
		ArrayList<Card> cards = new ArrayList<Card>();
		for(Card card: AppFrame.cardlist){
			cards.add(card);
		}
		Collections.sort(cards, new HandsortComparator());
		Collections.reverse(cards);
		for(Card card : cards){
			if(check_if_scored(card) || hand.cards_in_hand.contains(card)){
				
			} else{
				return card;
			}
		}
		return null;
		
	}
	
	public boolean points_trumps_gone(){
		Card ace = null;
		Card ten = null;
		for(Card card: AppFrame.cardlist){
			if(card.suit == Suit.DIAMONDS && card.value == Cardval.ACE){
				ace = card;
			} else if(card.suit == Suit.DIAMONDS && card.value == Cardval.TEN){
				ten = card;
			}
		}
		if(check_if_scored(ace) && check_if_scored(ten)){
			return true;
		} 
		return false;
	}
	
	public boolean points_trumps_gone_or_in_hand(){
		Card ace = null;
		Card ten = null;
		for(Card card: AppFrame.cardlist){
			if(card.suit == Suit.DIAMONDS && card.value == Cardval.ACE){
				ace = card;
			} else if(card.suit == Suit.DIAMONDS && card.value == Cardval.TEN){
				ten = card;
			}
		}
		if((check_if_scored(ace) || hand.cards_in_hand.contains(ace)) && (check_if_scored(ten) || hand.cards_in_hand.contains(ten))){
			return true;
		}
		return false;
	}
	
	public boolean can_win(){
		boolean canwin = false;
		if (Game.trick.cards_in_hand.isEmpty()){
			return true;
		}
		ZoleSuit followsuit = Game.trick.cards_in_hand.get(0).zolesuit;
		if(Game.trick.cards_in_hand.size() == 1){
			for(Card card: hand.cards_in_hand){
				if (card.beats(Game.trick.cards_in_hand.get(0))){
					if(card.zolesuit == ZoleSuit.TRUMPS && hand.contains_suit(followsuit)){
						break;
					}
					else{
						canwin = true;
					}
				}
			}
		}
		else if(Game.trick.cards_in_hand.size() == 2){
			for(Card card: hand.cards_in_hand){
				if(card.beats(Game.trick.cards_in_hand.get(0), Game.trick.cards_in_hand.get(1))){
					if(card.zolesuit == ZoleSuit.TRUMPS && hand.contains_suit(followsuit) && followsuit != ZoleSuit.TRUMPS){
						break;
					}
					else{
						canwin = true;
					}
				}
			}
		}
		return canwin;
	}
	
	//All aspects of choice to be overridden by individual types of player
	
	

	
}
