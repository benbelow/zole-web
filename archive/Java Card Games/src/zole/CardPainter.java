package zole;

import java.awt.Graphics;


public class CardPainter{

	public Card card;
	
	public CardPainter(Card card){
		this.card = card;
	}
	

	public void paint(Graphics g){
		g.drawImage(card.sprite,card.xpos,card.ypos,card.width,card.height,null);
	}
}
