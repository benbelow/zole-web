package zole;


import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.util.ArrayList;

public class Game implements MouseListener {

	public static int zoletree = 0;
	public static int currentplayer = 0; //0,1,2, based on round position not table position
	public static int roundnumber = 1;
	public static String stage = "choosing"; //choosing, putting down, no-one picked up, playing, scoring, reset 
	public static Trick trick = new Trick(3);
	public static Hand table;
	public static Card cardclicked;
	public boolean mousepressed = false;
	public static int keycodepressed;
	public static ZoleDeck thedeck = new ZoleDeck();
	public static ArrayList<Card> cards_scored = new ArrayList<Card>(); //cards scored visible to everyone (i.e. from tricks)
	public static ArrayList<Card> zole_cards_scored = new ArrayList<Card>(); //cards hidden to everyone
	
	public Player currentplayer(){
		for (Player player : AppFrame.playerlist){
			if (player.roundposition == currentplayer){
				return player;
			}
		}
		System.out.println("No player currently playing"); 
		return null;
	}
	
	public static void rotate(){ //rotates the player's roundposition 0/1/2
		for (Player player : AppFrame.playerlist) {
			player.roundposition += 1;
			if (player.roundposition == 3) {
				player.roundposition = 0;
			}
		}
	}
	
	public void arrangetable(){
		for (Player player: AppFrame.playerlist){
			player.hand.arrange(player.tableposition*100);
		}
		table.arrange(300);
		trick.arrange(300);
	}
	
	public void choose() {
		currentplayer().choose();
	}
	public void putdown() {
		currentplayer().putdown();
	}

	public void reset(){
		//System.out.println("reset");
		while(!Game.cards_scored.isEmpty()){
			thedeck.add(Game.cards_scored.get(0));
			Game.cards_scored.remove(0);
		}
		while(!Game.zole_cards_scored.isEmpty()){
			thedeck.add(Game.zole_cards_scored.get(0));
			Game.zole_cards_scored.remove(0);
		}
		for (Player player : AppFrame.playerlist){
			while(!player.cards_scored.isEmpty()){
				thedeck.add(player.cards_scored.get(0));
				player.cards_scored.remove(0);
			}
			while(!player.hand.cards_in_hand.isEmpty()){
				player.hand.give(thedeck, player.hand.cards_in_hand.get(0));
			}			
		}
		while(!trick.cards_in_hand.isEmpty()){
			trick.give(thedeck, trick.cards_in_hand.get(0));
		}
		while(!table.cards_in_hand.isEmpty()){
			table.give(thedeck, table.cards_in_hand.get(0));
		}
		thedeck.shuffle();
		//System.out.println("Deck contains: " + thedeck.cards_in_deck.size());
		thedeck.deal();
		roundnumber += 1;
		int tofocus = (roundnumber + 2) % 3;
		for (Player player: AppFrame.playerlist){
			if(player.playertype == "AI"){
				player.putdown = 0;
			}
			player.hand.sort();
			player.roundpoints = 0;
			player.outoftrumps = false;
			if(tofocus == player.tableposition){
				player.focus();
			}
		}
		System.out.println("Scores...");
		for(Player player: AppFrame.playerlist){
			System.out.println(player.name + " has " + player.gamepoints + " points.");
		}
		currentplayer = 0;
		stage = "choosing";
	}
	
	public void play_round(){
		if(currentplayer < 3 ){
			currentplayer().play_round();
		}
		else if(currentplayer == 3 ){
			Player winningplayer = trick.checkwon();
			//System.out.println(winningplayer.name);
			
			while (!trick.cards_in_hand.isEmpty()){
				winningplayer.score(trick.cards_in_hand.get(0), trick,false);
			}
			winningplayer.focus();
			currentplayer = 0;
			if(winningplayer.hand.cards_in_hand.isEmpty()){
				stage = "scoring";
			}
			
		}

		mousepressed = false;
	}
	
	public void scoring(){
		int bigscore = 0;
		int smallscore = 0;
		int toscore = 0;
		boolean bigwon;
		boolean iszole = false;
		System.out.println("Round " + roundnumber);
		for(Player player: AppFrame.playerlist){
			if(player.zole){
				iszole = true;
			}
			if(player.status == "small"){
				smallscore += player.roundpoints;
			} else if (player.status == "big"){
				bigscore += player.roundpoints;
			}
		}
		if(bigscore == 120){
			bigwon = true;
			toscore += 3;
		} else if(bigscore > 90){
			bigwon = true;
			toscore += 2;
		} else if(bigscore > 60){
			bigwon = true;
			toscore += 1;
		} else if(bigscore > 30){
			bigwon = false;
			toscore += 2;
		} else if(bigscore > 0){
			bigwon = false;
			toscore += 3;
		} else{
			bigwon = false;
			toscore += 4;
		}
		if(iszole){
			toscore += 3;
		}
		if(zoletree != 0){
			toscore += 1;
			zoletree -= 1;
		}
		for(Player player: AppFrame.playerlist){
			if(bigwon){
				if(player.status == "small"){
					player.gamepoints -= toscore;
				} else if(player.status == "big"){
					player.gamepoints += toscore*2;
				}
			} else if(!bigwon){
				if(player.status == "small"){
					player.gamepoints += toscore;
				} else if(player.status == "big"){
					player.gamepoints -= toscore*2;
				}
			}
		}
		System.out.println("Big one got: " + bigscore + " Little ones got: " + smallscore);
		stage = "reset";
	}
	
	public void play() {
		//System.out.println(stage);
		arrangetable();
		switch(stage){
		case "choosing": 			choose(); break;
		case "putting down": 		putdown(); break;
		case "no-one picked up": 	reset(); break;
		case "playing":				play_round(); break;
		case "scoring":				scoring(); break;
		case "reset":				reset(); break;
		default:					return;
		}
	}

	@Override
	public void mouseClicked(MouseEvent e) {
		//System.out.println("Stage: " + stage  + ". Currentplayer: " + currentplayer + " " + currentplayer().roundposition);
		int clickx = e.getX();
		int clicky = e.getY();
		for (Card card : AppFrame.cardlist) {
			if (card.at_point(clickx, clicky)) {
				cardclicked = card;
			}
		}

	}

	@Override
	public void mouseEntered(MouseEvent arg0) {
		// TODO Auto-generated method stub

	}

	@Override
	public void mouseExited(MouseEvent arg0) {
		// TODO Auto-generated method stub

	}

	@Override
	public void mousePressed(MouseEvent e) {
		mousepressed = true;
	}

	@Override
	public void mouseReleased(MouseEvent e) {
		mousepressed = false;
	}

}
