package zole;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;

public class Card {
	public int width = 71;
	public int height = 95;
	public Suit suit; //card's suit - hearts,spades,clubs,diamonds
	public ZoleSuit zolesuit; //suit to follow in zole - hearts,clubs,spades,trumps
	public Cardval value;
	public int points;
	public int xpos;
	public int ypos;
	public int suitpriority;
	public int valuepriority;
	public boolean flipped = false;
	public boolean visible = false;
	public BufferedImage sprite;
	public BufferedImage backsprite;
	Map<Suit,Integer> suitmap = new HashMap<Suit,Integer>();
	Map<Cardval,Integer> valuemap = new HashMap<Cardval, Integer>();
	
	public Card(Suit suit, Cardval value) {
		this.suit = suit;
		this.value = value;
		if(suit == Suit.DIAMONDS || value == Cardval.QUEEN || value == Cardval.JACK){
			zolesuit = ZoleSuit.TRUMPS;
			suitpriority = 1;
		} else{
			switch(suit){
			case SPADES: zolesuit = ZoleSuit.SPADES; suitpriority = 100;  break;
			case HEARTS: zolesuit = ZoleSuit.HEARTS; suitpriority = 1000;  break;
			case CLUBS: zolesuit = ZoleSuit.CLUBS;   suitpriority = 10000;  break;
			case DIAMONDS: break;
			}
		}
		if(zolesuit == ZoleSuit.TRUMPS){
			switch(value){
			case QUEEN: switch(suit){
						case CLUBS: valuepriority = 1; break;
						case SPADES: valuepriority = 2; break;
						case HEARTS: valuepriority = 3; break;
						case DIAMONDS: valuepriority = 4; break;
			} break;
			case JACK: switch(suit){
						case CLUBS: valuepriority = 5; break;
						case SPADES: valuepriority = 6; break;
						case HEARTS: valuepriority = 7; break;
						case DIAMONDS: valuepriority = 8; break;
			} break;
			case ACE: valuepriority = 9; break;
			case TEN: valuepriority = 10; break;
			case KING: valuepriority = 11; break;
			case NINE: valuepriority = 12; break;
			case EIGHT: valuepriority = 13; break;
			case SEVEN: valuepriority = 14; break;
			default: break;
			}
		} else{
			switch(value){
			case ACE: valuepriority = 1; break;
			case TEN: valuepriority = 2; break;
			case KING: valuepriority = 3; break;
			case NINE: valuepriority = 4; break;
			default: break;
			}
		}
		if(suitmap.isEmpty()){ //fills suitmap on making first card
			suitmap.put(Suit.CLUBS,11);
			suitmap.put(Suit.SPADES, 116);
			suitmap.put(Suit.HEARTS, 218);
			suitmap.put(Suit.DIAMONDS, 324);
		}
		if(valuemap.isEmpty()){
			valuemap.put(Cardval.ACE,38);
			valuemap.put(Cardval.TWO,111);
			valuemap.put(Cardval.THREE,184);
			valuemap.put(Cardval.FOUR, 257);
			valuemap.put(Cardval.FIVE,330);
			valuemap.put(Cardval.SIX,403);
			valuemap.put(Cardval.SEVEN,476);
			valuemap.put(Cardval.EIGHT,549);
			valuemap.put(Cardval.NINE,622);
			valuemap.put(Cardval.TEN,695);
			valuemap.put(Cardval.JACK,768);
			valuemap.put(Cardval.QUEEN,841);
			valuemap.put(Cardval.KING,914);
		}
		BufferedImage spritesheet = null; //loads spritesheet
		try {
			spritesheet = ImageIO.read(new File("playingcards.png"));
		} catch (IOException e) {
			System.out.println("No Image Loaded");
		}
		int y = 0; //sets up coordinates for card sprite
		int x = 0;
		y = suitmap.get(suit);
		x = valuemap.get(value);
		sprite = spritesheet.getSubimage(x+1, y+1, width, height);
		backsprite = spritesheet.getSubimage(118, 436, width, height);
		
		switch(this.value){ //assigns points value
			case ACE: points = 11; break;
			case TEN: points = 10; break;
			case KING: points = 4; break;
			case QUEEN: points = 3; break;
			case JACK: points = 2; break;
			default: points = 0; break;
		}

	}
	
	public void paint(Graphics g) {
		g.drawImage(sprite,xpos,ypos,width,height,null);
	}
	public void flip(){ //flips a card over
		BufferedImage tempsprite = sprite;
		sprite = backsprite;
		backsprite = tempsprite;
		flipped = !flipped;
	}
	public void flip(String state){ //flips a card to a specific state, up or down
		switch(state){
		case "up": if (flipped){
			this.flip();
		}
		break;
		case "down": if (!flipped){
			this.flip();
		}

		break;
		}
	}
	public boolean at_point(int x, int y){ //returns true if the card is at that point
		if(xpos <= x && x <= (xpos + width) && ypos <= y && y <= (ypos+ height)){
			return true;
		}
		return false;
	}

	public boolean beats(Card card1){ //checks whether this card beats card1 - card 1 to follow
		Trick trick = new Trick(2);
		trick.add(card1);
		trick.add(this);
		if(trick.winningcard() == this){
			return true;
		} else{
			return false;
		}
	}
	public boolean beats(Card card1, Card card2){ //checks whether beats two cards in a trick - card1 to follow
		Trick trick = new Trick(3);
		trick.add(card1);
		trick.add(card2);
		trick.add(this);
		if(trick.winningcard() == this){
			return true;
		} else{
			return false;
		}
	}
	
}
