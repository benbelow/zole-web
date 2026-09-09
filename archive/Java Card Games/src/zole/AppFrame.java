package zole;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import javax.swing.JFrame;




@SuppressWarnings("serial")
public class AppFrame extends JFrame {
	
	static ZolePanel contentpane = new ZolePanel(new BorderLayout());
	static Map<Card,CardPainter> cardpaintermap = new HashMap<Card, CardPainter>();
	static Set <Card> cardlist = cardpaintermap.keySet();
	static Collection <CardPainter> cardpainterlist = cardpaintermap.values();
	static ArrayList <Player> playerlist = new ArrayList <Player>();
	public static int width = 1000;
	public static int height = 480;
	
	public AppFrame(){
		super("Zole");
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		this.setPreferredSize(new Dimension(width, height));
		setLocation(100,100);
		setVisible(true);
		setFocusable(true);
		
		contentpane.setPreferredSize(new Dimension(width,height));
		this.add(contentpane);
		pack();
		contentpane.requestFocus();
	}
	
	
	
	public static void main(String[] args){
		AppFrame application = new AppFrame();
		Game game = new Game();
		System.out.println("Game Created");
		contentpane.addMouseListener(game);
		Player player1 = new AIPlayer(0,"Brian");
		Player player2 = new AIPlayer(1,"Nastya");
		Player player3 = new GreedyPlayer(2,"Ashes");
		System.out.println("Players Created");
		ZoleDeck newdeck = game.thedeck;
		System.out.println("Deck Created");
		newdeck.shuffle();
		System.out.println("Shuffled");
		((ZoleDeck) newdeck).deal();
		System.out.println("Dealt");
		game.table.arrange(300);
		for(Player player:playerlist){
			player.hand.sort();
			player.hand.arrange(player.tableposition*100);
		}
		
		contentpane.finishedsetup = true;
		
		for(Card card:cardlist){
			//System.out.println(card.value + " of " + card.suit );
			//System.out.println(card.zolesuit);
			if (!newdeck.cards_in_deck.contains(card) ){
				card.visible = true;
			}
			
			/*try {
				Thread.sleep(50);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}*/
			//card.visible = false;
		}
		
		while(true){
			game.play();
		}
		
		
		
	}
}
