package zole;

import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;

public class ZoleKeyListener implements KeyListener {

	@Override
	public void keyPressed(KeyEvent e) {
		int key = e.getKeyCode();
		Game.keycodepressed = key;
		switch(key){
		case KeyEvent.VK_D:
			for(Player player: AppFrame.playerlist){
				if(player.playertype == "AI"){
					player.hand.flip();
				}
			}
			Game.table.flip();
			break;
		case KeyEvent.VK_R:
			Game.stage = "reset";
		}
	}

	@Override
	public void keyReleased(KeyEvent e) {
		Game.keycodepressed = -1;
		
	}

	@Override
	public void keyTyped(KeyEvent e) {
		// TODO Auto-generated method stub
		
	}

}
